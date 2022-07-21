import json
import logging

import re
from datetime import timedelta, datetime

from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.aggregates import Max
from django.forms.models import model_to_dict
from django.template.loader import render_to_string
from django.utils import timezone

from rest_framework import serializers

from apps.core.rbac.models import User, UserDelegate
from apps.core.socket_chat.views import redis_pub_task, redis_pub_application_count
from apps.workflow.bpmn.eForm import EForm
from apps.workflow.bpmn.generate_document import GenerateDocument
from apps.workflow.bpmn.models import Task, Route, Application, Delegation, Step, Weekend, Holiday, BacktrackRoute
from apps.workflow.script.views import execute_script
from apps.dms.api.department.models import Department
from conf import licensed


class BPMNRoute:
    # create or update task
    @staticmethod
    def create_or_update_task(params):
        try:
            task = Task.objects.get(
                element_id=params.get('element_id'),
                process=params.get('process'),
                project=params.get('project')
            )

            for name, value in params.items():
                setattr(task, name, value)
            task.save()

        except Task.DoesNotExist:
            Task.objects.create(**params)


class BPMNEngine(object):
    def __init__(self, request, instance, position, start_app=None, out_open=None, application=None, manual_pass=False,
                 manual_final_user=None, claimed=False):
        self.request, self.instance, self.position, self.manual_user = request, instance, int(position), []
        self.next_user = self.next_task = self.manual_final_user = self.button_action = None
        self.start_app = True if start_app is not None and start_app == 'true' else False
        self.application = application
        self.application_data = None
        self.manual = self.finish_application = self.manual_pass = False
        self.claimed = claimed
        self.parallel = False
        self.out_open = out_open

        if manual_pass and manual_final_user:
            self.manual_pass = True
            self.manual_final_user = User.objects.get(pk=manual_final_user)

        # if task is init task, create application and draft delegation
        # or require the application id and task id to perform the action on it
        if self.instance.start and self.start_app and self.position == 1:
            self.application = self.create_application()
        else:
            if self.application is not None:
                self.application = Application.objects.get(pk=application)
                self.application_data = json.loads(self.application.data)
            else:
                raise serializers.ValidationError({'detail': 'Please provide the application id.'})

        # this is the delegation default to create or update the delegation information
        self.delegation_default = {
            'project': self.instance.project,
            'process': self.instance.process,
            'task': self.instance,
            'application': self.application,
            'user': self.request.user,
        }

        # set the current delegation globally
        if not self.claimed:
            try:
                self.current_delegation = Delegation.objects.get(Q(**{'status': 1}) | Q(**{'status': 2}),
                                                                 **self.delegation_default)
            except Delegation.DoesNotExist:
                raise serializers.ValidationError({'detail': 'Something is going wrong with delegation.'})

        self.response_dict = {
            'type': 'task',
            'manual': False,
            'end': False,
            'parallel': False,
            'application': model_to_dict(self.application)
        }

    # updates status of the delegatee #done by azmi
    @staticmethod
    def update_delegation_status(user):
        is_delegate_available = UserDelegate.objects.filter(is_active=1, absent_user=user).order_by('-id')
        if is_delegate_available.exists():
            for all_delegate in is_delegate_available:
                delegate = all_delegate
            if delegate is not None:
                if datetime.now().date() > delegate.end_date:
                    delegate.is_active = 0
                if delegate.start_date <= datetime.now().date() <= delegate.end_date:
                    delegate.is_active = 1
                delegate.save()
        return None

    # return weekends
    @staticmethod
    def weekends():
        return list(Weekend.objects.all().values_list('day', flat=True))

    # calculate weekend
    @staticmethod
    def calculate_weekend_holiday(from_date, number_of_days):
        business_days_to_add = number_of_days
        current_date = from_date

        while business_days_to_add:
            current_date += timedelta(days=1)
            weekday = current_date.weekday()

            if weekday in BPMNEngine.weekends():
                continue

            if Holiday.objects.filter(date=current_date).count():
                continue

            business_days_to_add -= 1

        return current_date

    # Set due date
    @staticmethod
    def due_date(task):
        task_duration = timezone.timedelta(hours=int(task.duration)).days
        return BPMNEngine.calculate_weekend_holiday(timezone.now(), task_duration)

    # Set risk date
    @staticmethod
    def risk_date(task):
        task_duration = timezone.timedelta(hours=(licensed.RISK_TASK_PERCENTAGE * int(task.duration)) / 100.0)

        if task_duration.days <= 0:
            return timezone.now() + timedelta(seconds=task_duration.seconds)
        return BPMNEngine.calculate_weekend_holiday(timezone.now(), task_duration.days)

    def get_backtrack_task(self, current_task_id):
        backtrack_route = BacktrackRoute.objects.get(application=self.current_delegation.application,
                                                     project=self.current_delegation.project)
        path = json.loads(backtrack_route.backtrack_path)
        recent_index = -1
        for index, each_path in enumerate(path):
            if each_path['task'] == current_task_id:
                recent_index = index
                break
        return path[recent_index - 1]

    def add_backtrack_path(self, user, task):
        # creating a backtrack path
        try:
            backtrack_route = BacktrackRoute.objects.get(application=self.current_delegation.application,
                                                         project=self.current_delegation.project)
        except BacktrackRoute.DoesNotExist:
            return
        path = json.loads(backtrack_route.backtrack_path)
        new_element_to_path = {
            'task': task.id,
            'user': user.id
        }
        path.append(new_element_to_path)
        backtrack_route.backtrack_path = json.dumps(path)
        backtrack_route.save()

    # Create application
    def create_application(self):
        if self.out_open == 'True':
            bool_out_open = True
        else:
            bool_out_open = False
        app = Application.objects.create(**{
            'project': self.instance.project,
            'process': self.instance.process,
            'status': 2,
            'init_user': self.request.user,
            'current_user': self.request.user,
            'data': json.dumps({}),
            'out_open': bool_out_open
        })

        backtrackRoute = BacktrackRoute.objects.create(**{
            'project': self.instance.project,
            'application': app,
            'backtrack_path': json.dumps([])
        })

        if licensed.CLIENT_NAME == 'aw6io2a':
            app.number = app.id
            app.save()

        if self.request.user is not None:
            Delegation.objects.create(**{
                'project': self.instance.project,
                'process': self.instance.process,
                'task': self.instance,
                'user': self.request.user,
                'application': app,
                'status': 2,
                'index_pos': 1,
                'due_date': BPMNEngine.due_date(self.instance),
                'risk_date': BPMNEngine.risk_date(self.instance)
            })
            redis_pub_application_count()
        return app

    # This function will run the script without interruption. Errors will be written in the error log.
    # If there will be any EForm as per any step, it will stop execution and return the EForm.
    def take_decision(self, button_action=None):
        self.button_action = button_action
        with transaction.atomic():
            step = self.instance.step
            position = self.position
            max_position = step.aggregate(Max('position'))['position__max']

            if max_position and position != -1:
                for i in range(position, max_position + 1):
                    try:
                        single_step = step.get(position=i)

                        if single_step.type == 0 and single_step.position == position:
                            if single_step.eform is None:
                                raise serializers.ValidationError({'detail': 'No eForm assigned.'})

                            if single_step.eform.content == '' or single_step.eform.content is None:
                                e_form = ''
                            else:
                                e_form = EForm(single_step.eform, self.application).generate_form()

                            return dict(self.response_dict, **{
                                'id': self.instance.id,
                                'task_name': self.instance.name,
                                'project_title': self.instance.project.title,
                                'type': 'eform',
                                'content': single_step.eform.content,
                                'process': self.instance.process,
                                'eform': e_form,
                                'current_pos': single_step.position,
                                'next_pos': -1 if single_step.position + 1 > max_position else single_step.position + 1,
                            })

                        elif single_step.type == 1 and single_step.position == position:
                            execute_script(self.instance, self.application, i)
                            position += 1

                        elif single_step.type == 2 and single_step.position == position:
                            GenerateDocument(single_step.output_document, self.application).generate_pdf()
                            position += 1

                        if position > max_position:
                            self.position = -1

                    except Step.DoesNotExist:
                        position += 1

            if self.position == -1 or max_position is None or max_position == 0:
                if self.cyclic_assignment():
                    return dict(self.response_dict, **{
                        'target': self.next_task.name,
                        'user': self.next_user.get_full_name(),
                    })

                if self.next_assignment():
                    if self.finish_application:
                        # here
                        if licensed.DMS == '9dL53eBFDK' and licensed.WORKFLOW == 'aBX3RODumf' and \
                                        self.application.app_input_doc.count() > 0: #and licensed.USER_DMS == '1q2w3e' and licensed.USER_WORKFLOW == '1q2w3e'
                            upload_dms = True
                        else:
                            upload_dms = False
                        return dict(self.response_dict, **{
                            'end': True,
                            'upload_dms': upload_dms,
                            'detail': 'The application has been completed',
                        })
                    else:
                        if self.button_action == 'recheck':
                            return dict(self.response_dict, **{
                                'target': self.next_task.name,
                                'user': ", ".join(user.get_full_name() for user in self.next_user),
                                'recheck': True,
                            })
                        elif self.button_action == 'reject':
                            return dict(self.response_dict, **{
                                'target': self.next_task.name,
                                'user': ", ".join(user.get_full_name() for user in self.next_user),
                                'reject': True,
                            })
                        elif self.manual:
                            return dict(self.response_dict, **{
                                'manual': True,
                                'target': self.next_task.name,
                                'user': [dict(tp) for tp in set(tuple(item.items()) for item in self.manual_user)],
                            })
                        elif self.parallel:
                            return dict(self.response_dict, **{
                                'parallel': True
                            })
                        return dict(self.response_dict, **{
                            'target': self.next_task.name,
                            'user': ", ".join(user.get_full_name() for user in self.next_user)
                        })
                else:
                    raise serializers.ValidationError({'detail': 'There is something wrong with user assignment'})

    # check if recheck is being pressed
    def set_recheck_assignment_user(self, specific_task=None, user=None):
        self.current_delegation.additional_status = 1
        self.current_delegation.save()
        if specific_task is None:
            target_task = Task.objects.get(pk=self.current_delegation.sent_task.id)
        else:
            target_task = specific_task
        if user is not None:
            return self.next_task_assignment_op(target_task, self.current_delegation.routing_type, 'recheck', user)
        else:
            return self.next_task_assignment_op(target_task, self.current_delegation.routing_type, 'recheck')

        # set user for cyclic assignment
    def set_cyclic_assignment_user(self, users):
        for user in users:
            user_to_be_written = user
            self.update_delegation_status(user)  # checking if user has any delegation or not azmi
            is_delegate_available = UserDelegate.objects.filter(is_active=1, absent_user=user).order_by('-id')
            if is_delegate_available.exists():
                for all_delegate in is_delegate_available:
                    delegate = all_delegate
                    user_to_be_written = delegate.present_user

            try:
                current_delegation = Delegation.objects.get(Q(status=0) | Q(status=4),
                                                                **dict(self.delegation_default, **{
                                                                    'user': user_to_be_written,
                                                                    'index_pos': self.current_delegation.index_pos
                                                                }))
                if is_delegate_available.exists():
                    current_delegation.is_delegated = True
                    current_delegation.actual_task_user = user
                    current_delegation.save()
                continue
            except Delegation.DoesNotExist:
                return user_to_be_written

            return None

    # After cyclic assignment this will make the current delegation completed and send email
    # to next user.
    def cyclic_assignment_final_op(self, user):
        self.next_task = self.instance
        self.next_user = user
        a = self.application
        a.status = 1
        a.save()
        if self.button_action != 'recheck':
            self.add_backtrack_path(self.next_user, self.next_task)
        self.workflow_send_mail()
        return True

    # Do the rules operation
    def rules_op(self):

        rules = self.instance.task_based_rules.filter(condition__isnull=False).exclude(
            user=self.request.user)

        if rules.count():
            for rule in rules:
                if self.check_condition(rule.condition):
                    return self.set_cyclic_assignment_user([rule.user, ])

        return False

    # Cyclic assignment that means it will not assign to current user or other user who
    # has already participated in current index position.
    def cyclic_assignment(self):
        if not self.instance.start:
            if self.instance.assignment_type == 0:
                final_user = None

                if self.instance.rules_applied:
                    if not self.rules_op():
                        return False

                    final_user = self.rules_op()

                if not final_user:
                    users = self.instance.user.exclude(pk=self.request.user.id)
                    for t in self.instance.user.all():  # required to break the cycle when delegatee assigned # azmi
                        if t.id != self.request.user.id:
                            is_delegate = UserDelegate.objects.filter(is_active=1, absent_user=t,
                                                                      present_user=self.request.user)
                            if is_delegate.exists():
                                users = users.exclude(pk=t.id)
                                break
                    if users.count():
                        final_user = self.set_cyclic_assignment_user(users)

                if not final_user:
                    users = User.objects.filter(group__task=self.instance).exclude(pk=self.request.user.id)
                    for t in self.instance.user.all():  # required to break the cycle when delegatee assigned # azmi
                        if t.id != self.request.user.id:
                            is_delegate = UserDelegate.objects.filter(is_active=1, absent_user=t,
                                                                      present_user=self.request.user)
                            if is_delegate.exists():
                                users = users.exclude(pk=t.id)
                                break
                    if users.count():
                        final_user = self.set_cyclic_assignment_user(users)

                if final_user:
                    BPMNEngine.complete_delegation(self.current_delegation)
                    Delegation.objects.get_or_create(
                        defaults={
                            'due_date': BPMNEngine.due_date(self.instance),
                            'risk_date': BPMNEngine.risk_date(self.instance)
                        }, **dict(self.delegation_default, **{
                            'user': final_user,
                            'sent_by': self.request.user,
                            'status': 1,
                            'index_pos': self.current_delegation.index_pos
                        })
                    )

                    return self.cyclic_assignment_final_op(final_user)
                else:
                    return False
        else:
            return False

    # Send email or notification about new task
    def workflow_send_mail(self, user=None, button_action=None, application_end=None):
        if user is not None:
            subject, from_email, to = 'New Task assigned to your delegatee', \
                                      self.request.user.email, user.email
            html_content = render_to_string('email/delegatee_email.html',
                                            {
                                                'email_body': 'Green Office would like to kindly inform you that '
                                                              'your task is being assigned to your delegatee',
                                                'user': user.get_full_name(),
                                                'next_user': self.next_user.get_full_name(),
                                                'sent_by': self.request.user.get_full_name(),
                                                'init_date': self.application.created_at.strftime('%d %B, %Y'),
                                                'due_date': BPMNEngine.due_date(self.next_task).strftime('%d %B, %Y'),
                                                'project_name': self.next_task.project.title,
                                                'app_number': self.application.number
                                            })
        elif button_action is not None:
            subject, from_email, to = 'Application Rejected', \
                                      self.request.user.email, self.application.init_user.email
            html_content = render_to_string('email/delegatee_email.html',
                                            {
                                                'email_body': 'Green Office would like to kindly inform you that '
                                                              'your initiated task has been rejected by',
                                                'user': self.application.init_user.get_full_name(),
                                                'next_user': self.request.user.get_full_name(),
                                                'init_date': self.application.created_at.strftime('%d %B, %Y'),
                                                'project_name': self.application.project.title,
                                                'app_number': self.application.number
                                            })
        elif application_end is not None:
            subject, from_email, to = 'Application Completed', \
                                      self.request.user.email, self.application.init_user.email
            html_content = render_to_string('email/application_completed_email.html',
                                            {
                                                'name': self.application.init_user.get_full_name(),
                                                'app_number': self.application.number
                                            })
            if self.application.out_open is True:
                ano_mail_content = render_to_string('email/application_completed_email.html',
                                                    {
                                                        'company_name': 'Shimanto Bank',
                                                        'name': json.loads(self.application.data).get('name'),
                                                        'app_number': self.application.number
                                                    })
                send_mail(subject='Account Opening',
                          message='',
                          from_email=licensed.EMAIL_HOST_USER,
                          recipient_list=[json.loads(self.application.data).get('email')],
                          html_message=ano_mail_content,
                          fail_silently=True)

        else:
            subject, from_email, to = 'A new task has arrived', self.request.user.email, self.next_user.email
            delegation_link = '{}/workflow/case/link/{}/{}'.format(self.request.META['HTTP_HOST'], self.next_task.id,
                                                                   self.application.id)
            html_content = render_to_string('email/next_workflow.html',
                                            {
                                                'next_user': self.next_user.get_full_name(),
                                                'sent_by': self.request.user.get_full_name(),
                                                'delegation_link': delegation_link,
                                                'init_date': self.application.created_at.strftime('%d %B, %Y'),
                                                'due_date': BPMNEngine.due_date(self.next_task).strftime('%d %B, %Y'),
                                                'project_name': self.next_task.project.title,
                                                'app_number': self.application.number
                                            })

            if self.application.out_open is True and self.current_delegation.index_pos == 1:
                mail_content = render_to_string('email/anonymous_user_mail.html',
                                                {
                                                    'company_name': 'Shimanto Bank',
                                                    'app_number': self.application.number,
                                                    'name': json.loads(self.application.data).get('name')
                                                })
                send_mail(subject='Account Opening',
                          message='',
                          from_email=licensed.EMAIL_HOST_USER,
                          recipient_list=[json.loads(self.application.data).get('email')],
                          html_message=mail_content,
                          fail_silently=True)

        try:
            send_mail(subject=subject, message='',
                      from_email=licensed.EMAIL_HOST_USER,
                      recipient_list=[to], html_message=html_content, fail_silently=True)
        except:
            pass

        if button_action is None and application_end is None:
            recipients = list()
            recipients.append(self.next_user.id)
            redis_pub_task(html_content, recipients)

    # this will check all conditions. Return True or False
    def check_condition(self, condition_str):
        if self.button_action is not None and self.button_action == 'recheck':
            self.current_delegation.additional_status = 1
            self.current_delegation.save()
        exact_condition = condition_str
        if condition_str == 'true':
            return True

        variables = re.findall('[@]\S*', condition_str)
        if len(variables):
            for v in variables:
                variable_value = json.loads(self.application.data).get(re.sub('@', '', v))
                variable_value = '' if variable_value is None else variable_value
                if variable_value != '' and v != '@_recheck_':
                    try:
                        if variable_value.find('.') == -1:
                            int(variable_value)
                        else:
                            float(variable_value)
                    except ValueError:
                        variable_value = '"' + variable_value + '"'
                    condition_str = re.sub(v, variable_value, condition_str)
                elif variable_value == "1" and v == '@_recheck_':
                    try:
                        if variable_value.find('.') == -1:
                            int(variable_value)
                        else:
                            float(variable_value)
                    except ValueError:
                        variable_value = '"' + variable_value + '"'
                    condition_str = re.sub(v, variable_value, condition_str)
                else:
                    condition_str = re.sub(v, "0", condition_str)

        try:
            if condition_str == '':
                return False
            if eval(condition_str):
                return True
            else:
                logger = logging.getLogger('warning_logger')
                logger.warning(
                    '[FALSE CONDITION] project: {}({}); app number: {}; user: {}; exact condition: [{}] || '
                    'generated condition: [{}]'.format(self.instance.name,
                                                       self.instance.project.title,
                                                       self.application.number,
                                                       self.current_delegation.user.get_full_name(),
                                                       exact_condition,
                                                       condition_str))
        except (TypeError, NameError, SyntaxError):
            logger = logging.getLogger('warning_logger')
            logger.warning(
                'project: {}({}); app number: {}; user: {}; exact condition: [{}] || '
                'generated condition: [{}]'.format(self.instance.name,
                                                   self.instance.project.title,
                                                   self.application.number,
                                                   self.current_delegation.user.get_full_name(),
                                                   exact_condition,
                                                   condition_str))

            raise serializers.ValidationError(
                {'detail': 'Condition syntax or typo error. '
                           '<strong>Exact condition:</strong> '
                           '[{}] and <strong>generated condition</strong>: [{}]'.format(exact_condition,
                                                                                        condition_str)})

    # This will switch to the function as per task type
    def type_switcher(self):
        if self.current_delegation.is_recheck and self.application.project.recheck == 2 and self.button_action != 'recheck':
            self.next_task = self.current_delegation.sent_task
            return self.task_operation()
        elif self.current_delegation.is_recheck and self.button_action == 'recheck':
            try:
                route = Route.objects.get(Q(project=self.instance.project) & Q(process=self.instance.process)
                                              & Q(target=self.current_delegation.task)
                                              & ~Q(source__type="bpmn:ExclusiveGateway"))
            except Route.DoesNotExist:
                    # or Route.MultipleObjectsReturned:
                st = self.get_backtrack_task(self.current_delegation.task.id)
                self.next_task = Task.objects.get(pk=st['task'])
                selected_user = User.objects.get(pk=st['user'])
                return self.task_operation(self.next_task, selected_user)
            except Route.MultipleObjectsReturned:
                st = self.get_backtrack_task(self.current_delegation.task.id)
                self.next_task = Task.objects.get(pk=st['task'])
                selected_user = User.objects.get(pk=st['user'])
                return self.task_operation(self.next_task, selected_user)

            if route.source.type != "bpmn:StartEvent":
                self.next_task = route.source
                return self.task_operation(route.source)
            else:
                raise serializers.ValidationError({'detail': 'You are initiator. You cannot backtrack for recheck'})

        else:
            route = Route.objects.filter(project=self.instance.project, process=self.instance.process,
                                             source=self.instance)
            for r in route:
                self.next_task = r.target
                if r.target.type != 'bpmn:ExclusiveGateway' and self.current_delegation.is_recheck is False and self.button_action == 'recheck':
                    self.next_task = self.current_delegation.sent_task
                    return self.task_operation()
                if r.target.type == 'bpmn:Task':
                    return self.task_operation()
                elif r.target.type == 'bpmn:ExclusiveGateway':
                    return self.exclusive_gateway_operation()
                elif r.target.type == 'bpmn:ParallelGateway':
                    return self.parallel_gateway_operation()
                elif r.target.type == 'bpmn:EndEvent':
                    return self.end_event_operation()

        redis_pub_application_count()

    # make delegation status to completed
    @staticmethod
    def complete_delegation(delegation, button_action=None):
        delegation.status = 0
        delegation.finish_date = timezone.now()
        if button_action is not None and button_action == 'reject':
            delegation.additional_status = 0
        delegation.save()

    # Find out next task
    def next_assignment(self):
        if self.type_switcher():
            if not self.manual or self.manual_pass:
                pass
            return True
        else:
            return False

    # skip completed task
    def skip_completed(self, user):
        try:
            Delegation.objects.get(**dict(self.delegation_default, **{
                'user': user,
                'status': 0,
                'index_pos': self.current_delegation.index_pos
            }))
            return None
        except Delegation.DoesNotExist:
            return user

    # operation for manual assignment
    def manual_task_op(self, task, rule_based_users=None):
        self.manual = True

        if not rule_based_users:
            for u in task.user.all():
                self.manual_user.append({'id': u.id, 'name': u.get_full_name()})

            for u in User.objects.filter(group__task=task):
                self.manual_user.append({'id': u.id, 'name': u.get_full_name()})
        else:
            for u in rule_based_users:
                self.manual_user.append({'id': u.id, 'name': u.get_full_name()})

        return True

    def get_manager(self, department):
        report_to = department.manager
        if self.request.user == department.manager:
            parent_department = Department.objects.get(pk=department.parent.id)
            report_to = parent_department.manager
        if report_to is not None:
            return report_to
        else:
            parent_department = Department.objects.get(pk=department.parent.id)
            return self.get_manager(parent_department)

    # Select the task user
    def select_task_user(self, task):
        task_user = task.user.first()

        if not task_user:
            task_user = User.objects.filter(group__task=task).first()

        if task_user:
            return task_user
        else:
            raise serializers.ValidationError({'detail': 'Please assign user to next task. Otherwise '
                                                         'the process can not go further.'})

    # It will assign to next task's user. If the task is init task the application initiator will be assigned.
    # the delegation and application status will be todo and it will send email
    def next_task_assignment_op(self, task, routing_type, button_action=None, user=None):
        users = []
        status = 1

        if task.start:
            users.append(self.application.init_user)
        else:
            if self.manual_pass:
                if user is not None:
                    users.append(user)
                else:
                    users.append(self.manual_final_user)
            else:
                if task.rules_applied and task.assignment_type not in [1, ]:
                    rules = task.task_based_rules.filter(condition__isnull=False)

                    if rules.count():
                        rule_based_users = []

                        for rule in rules:
                            if self.check_condition(rule.condition):
                                if task.assignment_type == 2:
                                    if self.skip_completed(rule.user):
                                        rule_based_users.append(rule.user)
                                    else:
                                        continue
                                else:
                                    users.append(rule.user)
                                    break

                        if task.assignment_type == 0:
                            if not users:
                                raise serializers.ValidationError(
                                    {'detail': 'The process can not go further because no '
                                               'condition applied to any user.'})
                        elif task.assignment_type == 2:
                            if rule_based_users:
                                return self.manual_task_op(task, rule_based_users)
                            else:
                                raise serializers.ValidationError(
                                    {'detail': 'The process can not go further because no '
                                               'condition applied to any user.'})
                    else:
                        raise serializers.ValidationError(
                            {'detail': 'The process can not go further because no condition applied to any user.'})

                elif task.assignment_type == 0:
                    if user is not None:
                        users.append(user)
                    else:
                        users.append(self.select_task_user(task))
                elif task.assignment_type == 1:
                    var_approve = self.request.data.get('approve')
                    var_status = self.request.data.get('status')

                    if (var_approve is not None and int(var_approve) == 2) or \
                            (var_status is not None and int(var_status) == 2):
                        manger_assigned_latest = Delegation.objects.filter(task=task,
                                                                           process=task.process,
                                                                           project=task.project,
                                                                           application=self.application).latest('id')
                        users.append(manger_assigned_latest.user)
                    elif button_action == 'recheck':
                        selected_user = self.current_delegation.sent_by
                        if user is not None:
                            selected_user = user
                        users.append(selected_user)
                    else:
                        report_to = self.get_manager(self.request.user.department)
                        if report_to:
                            users.append(report_to)
                        else:
                            raise serializers.ValidationError(
                                {'detail': 'No manager is defined for {}'.format(self.request.user.get_full_name())})

                elif task.assignment_type == 2 and not self.manual_pass:
                    if button_action == 'recheck':
                        selected_user = self.current_delegation.sent_by
                        if user is not None:
                            selected_user = user
                        users.append(selected_user)
                    else:
                        return self.manual_task_op(task)

                elif task.assignment_type == 3:
                    status = 3
                    for u in task.user.all():
                        users.append(u)
                    for u in User.objects.filter(group__task=task):
                        users.append(u)
        for index in range(len(users)):
            user = users[index]
            # check if delegatee assigned # azmi
            self.update_delegation_status(user)
            is_delegate_available = UserDelegate.objects.filter(is_active=1, absent_user=user).order_by('-id')
            if is_delegate_available.exists():
                for all_delegate in is_delegate_available:
                    delegate = all_delegate

            defaults = {
                'due_date': BPMNEngine.due_date(task),
                'risk_date': BPMNEngine.risk_date(task),
                'index_pos': self.current_delegation.index_pos + 1
            }
            lookups = {
                'project': task.project,
                'process': task.process,
                'task': task,
                'sent_task': self.instance,
                'application': self.application,
                'sent_by': self.request.user,
                'status': status,
                'user': user,
                'routing_type': routing_type
            }
            if self.button_action is not None and self.button_action == 'recheck':
                lookups['is_recheck'] = True
            if is_delegate_available.exists():  # check if delegatee assigned # azmi
                lookups['user'] = delegate.present_user
                lookups['is_delegated'] = True
                lookups['actual_task_user'] = delegate.absent_user
            self.complete_delegation(self.current_delegation)
            Delegation.objects.get_or_create(defaults=defaults, **lookups)
            self.next_task = task
            if is_delegate_available.exists():  # check if delegatee assigned # azmi
                self.next_user = delegate.present_user
                users[index] = delegate.present_user
            else:
                self.next_user = user
            a = self.application
            a.status = status
            a.save()
            if self.button_action != 'recheck':
                self.add_backtrack_path(self.next_user, self.next_task)
            self.workflow_send_mail()
            if is_delegate_available.exists():  # check if delegatee assigned # azmi
                self.workflow_send_mail(user)
        self.next_user = users
        redis_pub_application_count()
        return True

    # this will preform the end task
    def end_event_operation(self, button_action=None):
        if self.button_action is not None and self.button_action == 'recheck':
            return self.set_recheck_assignment_user()
        if button_action is not None and button_action == 'reject':
            self.complete_delegation(self.current_delegation, 'reject')
        else:
            self.complete_delegation(self.current_delegation)
        a = self.application
        a.status = 0
        a.save()
        self.finish_application = True
        # send mail to init user to notify Application is completed #Rawnak
        self.workflow_send_mail(application_end=True)

        return True

    # task based operations
    def task_operation(self, specific_task=None, user=None):
        if self.button_action is not None and self.button_action == 'recheck' and specific_task is None:
            return self.set_recheck_assignment_user()
        elif self.button_action is not None and self.button_action == 'recheck' and specific_task is not None:
            if user is not None:
                return self.set_recheck_assignment_user(specific_task, user)
            else:
                return self.set_recheck_assignment_user(specific_task)
        if self.next_task.type == 'bpmn:EndEvent':
            return self.end_event_operation()
        return self.next_task_assignment_op(self.next_task, self.current_delegation.routing_type)

    # Gateway based operations
    def exclusive_gateway_operation(self):
        #if self.button_action == 'recheck':
            #print("exclusive gateway condition")
            #return self.set_recheck_assignment_user()
            #print("getway", "recheck")
        route = Route.objects.filter(project=self.next_task.project, process=self.next_task.process,
                                     source=self.next_task, condition__isnull=False).exclude(condition__exact='')

        if self.button_action == 'recheck':
            is_recheck_exist = 0
            if route.count():
                for r in route:
                    index = r.condition.find('@_recheck_')
                    if index != -1:
                        is_recheck_exist = 1
                        break
            if is_recheck_exist == 0:
                return self.set_recheck_assignment_user()

        if route.count():
            for r in route:
                route_condition = False

                if self.check_condition(r.condition):
                    route_condition = True

                if route_condition:
                    self.next_task = r.target

                    if r.target.type == 'bpmn:Task':
                        return self.next_task_assignment_op(r.target, self.current_delegation.routing_type)
                    elif r.target.type == 'bpmn:ExclusiveGateway':
                        return self.exclusive_gateway_operation()
                    elif r.target.type == 'bpmn:ParallelGateway':
                        return self.parallel_gateway_operation()
                    elif r.target.type == 'bpmn:EndEvent':
                        return self.end_event_operation()

            raise serializers.ValidationError({'detail': 'The process can not go further because every possible '
                                                         'condition got false direction.'})
        else:
            raise serializers.ValidationError({'detail': 'The process can not go further because every possible '
                                                         'condition got false direction.'})

    # parallel gateway operation
    def parallel_gateway_operation(self):
        targets = Route.objects.filter(project=self.next_task.project, process=self.next_task.process,
                                       source=self.next_task)

        if self.current_delegation.routing_type == 0:
            for t in targets:
                self.next_task_assignment_op(t.target, 1)
                self.parallel = True
            return True

        elif self.current_delegation.routing_type == 1:
            self.complete_delegation(self.current_delegation)
            route = Route.objects.filter(project=self.next_task.project, process=self.next_task.process,
                                         target=self.next_task)

            for r in route:
                count = Delegation.objects.filter(application=self.application, task=r.source, status=0).count()
                if count == 0:
                    self.parallel = True
                    return True

            for r in targets:
                self.next_task = r.target

                if r.target.type == 'bpmn:Task':
                    return self.next_task_assignment_op(r.target, 0)
                elif r.target.type == 'bpmn:ExclusiveGateway':
                    return self.exclusive_gateway_operation()
                elif r.target.type == 'bpmn:ParallelGateway':
                    return self.parallel_gateway_operation()
                elif r.target.type == 'bpmn:EndEvent':
                    return self.end_event_operation()

    def claim_operation(self, user):
        self.next_user = User.objects.get(pk=user)
        self.next_task = self.instance
        delegations = Delegation.objects.filter(project=self.instance.project, process=self.instance.process,
                                                task=self.instance, status=3, application=self.application)

        for d in delegations.filter(user=self.next_user):
            d.status = 1
            d.save()

        delegations.exclude(user=user).delete()
        self.workflow_send_mail()
        redis_pub_application_count()
        return dict(self.response_dict, **{
            'target': self.next_task.name,
            'user': self.next_user.get_full_name()
        })
