import logging

from datetime import date, timedelta
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone

from apps.dms.documents.models import Documents
from apps.dms.api.category.models import Category
from conf import licensed


class Command(BaseCommand):
    help = 'Send email to document uploader for document expiry'

    def handle(self, *args, **options):
        date_from = date.today()
        date_to = date_from + timedelta(licensed.DAYS)
        queryset = Documents.objects.filter(locked=False, deleted=False, archived=False, published=True,
                                                expiry_date__range=[date_from, date_to])

        for query in queryset:
            # docTypes = Category.objects.get(id=query.doc_type.id)
            # docTypes = docTypes.get_ancestors(ascending=False)
            # category = '-> '.join([str(i) for i in docTypes])
            # print("category", category)
            params = {
                'uploaded_by': query.uploader.get_full_name(),
                'expiry_date': query.expiry_date.strftime('%d %B, %Y'),
                'document_name': query.filename,
                'document_type': query.doc_type.name,
                'document_version': query.version,
                'expiry_action': query.get_action_upon_expiry_display(),
            }

            html_content = render_to_string('email/expirydocumentnotification.html', params)
            send_mail(subject="Document going to be expired", message='', from_email=licensed.EMAIL_HOST_USER,
                      recipient_list=[query.uploader.email],
                      html_message=html_content, fail_silently=True)

