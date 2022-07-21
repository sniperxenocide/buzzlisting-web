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

    def handle(self, *args, **options):
        current_day = timezone.now().date()
        delegations = Delegation.objects.filter(risk_date__date__gte=current_day, status=1)

        for delegation in delegations:
            # global delegation options
            logger = logging.getLogger('warning_logger')
            user_email = delegation.user.email
            task_name = '{}({})'.format(delegation.task.name, delegation.project.title)
            subject = '{} is at risk.'.format(task_name)
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

            html_content = render_to_string('email/risk_task_email.html', params)
            send_mail(subject=subject, message='', from_email=licensed.EMAIL_HOST_USER, recipient_list=[user_email],
                      html_message=html_content, fail_silently=True)

            # write log
            logger.warning('{} is at risk for {}.'.format(task_name, delegation.user.get_full_name()))
            self.stdout.write(self.style.SUCCESS('Mail send successful.'))
