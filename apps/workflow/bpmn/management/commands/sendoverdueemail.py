import logging

from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone

from apps.workflow.bpmn.engine import BPMNEngine
from apps.workflow.bpmn.models import Delegation
from conf import licensed


class Command(BaseCommand):
    help = 'Send email to line manager if any task is over due'

    def add_arguments(self, parser):
        parser.add_argument('--manager', action='store_true')

    def handle(self, *args, **options):
        current_day = timezone.now().date()
        delegations = Delegation.objects.filter(due_date__date__lte=current_day, status=1)

        for delegation in delegations:
            # global delegation options
            logger = logging.getLogger('warning_logger')
            user_email = delegation.user.email
            task_name = '{}({})'.format(delegation.task.name, delegation.project.title)
            subject = '{} has been overdue'.format(task_name)
            delegation_link = '{}/workflow/case/form/{}/{}'.format(licensed.APP_HOST, delegation.task.id,
                                                                   delegation.application.id)
            manager = delegation.user.reports_to
            params = {
                'manager_assignment': False,
                'task': task_name,
                'next_user': delegation.user.get_full_name(),
                'sent_by': delegation.user.get_full_name(),
                'delegation_link': delegation_link,
                'init_date': delegation.application.created_at.strftime('%d %B, %Y'),
                'due_date': delegation.due_date.strftime('%d %B, %Y'),
                'project_name': delegation.project.title,
                'app_number': delegation.application.number
            }

            if manager:
                params.update({'manager': manager.get_full_name()})

            # user part
            if options.get('manager') and manager:
                params.update({'manager_assignment': True})

            html_content = render_to_string('email/overdue_email.html', params)
            send_mail(subject=subject, message='', from_email=licensed.EMAIL_HOST_USER, recipient_list=[user_email],
                      html_message=html_content, fail_silently=True)

            # write log
            logger.warning('{} has been overdue for {}.'.format(task_name, delegation.user.get_full_name()))

            # manager part
            if manager:
                user_email = manager.email
                params.update({'current_user': delegation.user.get_full_name()})

                if options.get('manager'):
                    # make existing delegation as reassigned
                    delegation.status = 4
                    delegation.finish_date = None
                    delegation.update_date = timezone.now()
                    delegation.save()

                    # create delegation for manager
                    delegation.pk = None
                    delegation.status = 1
                    delegation.user = manager
                    delegation.due_date = BPMNEngine.due_date(delegation.task)
                    delegation.risk_date = BPMNEngine.risk_date(delegation.task)
                    delegation.finish_date = None
                    delegation.save()

                    # prepare email template variable for manager
                    params.update({'manager_assignment': True})

                html_content = render_to_string('email/overdue_manager_email.html', params)
                send_mail(subject=subject, message='', from_email=licensed.EMAIL_HOST_USER, recipient_list=[user_email],
                          html_message=html_content, fail_silently=True)

                # write log
                logger.warning('{} has been overdue for {}. Mail has been sent '
                               'to manager: {}.'.format(task_name, delegation.user.get_full_name(),
                                                        manager.get_full_name()))
            else:
                logger.warning('Did not found any manager for {}.'.format(delegation.user.get_full_name()))

            self.stdout.write(self.style.SUCCESS('Mail send successful.'))
