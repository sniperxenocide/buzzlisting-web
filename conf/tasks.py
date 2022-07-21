import json
from datetime import timedelta
from pathlib import Path

import os
import zipfile

from django.core.mail import send_mail
from django.core.files.storage import default_storage
from django.template.loader import render_to_string
from django.utils import timezone

from apps.core.rbac.models import User
from apps.dms.documents.elastic_search import Elastic
from apps.dms.documents.models import Documents, DownloadSearchResult
from conf import settings
from conf.celery import app


class DMSTasks(object):
    @staticmethod
    def create_zip(user_id, doc_id_list):
        user = User.objects.get(pk=user_id)
        documents = Documents.objects.filter(id__in=doc_id_list).only('filepath', 'filename', 'id')
        print(documents)
        zip_folder_path = os.path.join(settings.MEDIA_ROOT, 'zip_files', str(user.id))

        # create zip folder
        path = Path(zip_folder_path)
        path.mkdir(parents=True, exist_ok=True)

        zip_filename = timezone.now().strftime("%Y_%m_%d_%H_%M_%S")
        media_file = zip_file_path = '{}/{}.zip'.format(zip_folder_path, zip_filename)
        zip_file_path = zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED)

        # write file to zip file
        for document in documents:
            path = default_storage.path(document.filepath)
            print(path)
            filename, ext = os.path.splitext(path)
            metadata = json.loads(document.metadata)
            meta_string = ''

            for meta in metadata:
                meta_string += meta.get('value') + '-'

            doc_filename = document.filename.replace(' ', '_')
            name = '{}-{}-{}{}{}'.format(doc_filename, document.doc_type.name, meta_string, document.id, ext)
            zip_file_path.write(path, name)

        zip_file_path.close()
        final_zip_file_path = media_file.replace(settings.MEDIA_ROOT + '/', '')
        instance = DownloadSearchResult.objects.create(**{
            'user': user,
            'path': final_zip_file_path
        })

        # send zip file path as attachment through email
        # subject, from_email, to = 'Your file is ready to download', settings.EMAIL_HOST_USER, user.email
        # download_link = 'http://{}/login/?next={}{}'.format(settings.APP_HOST, settings.MEDIA_URL,
        # final_zip_file_path)
        # html_content = render_to_string('email/download_search_files.html', {
        #     'user_full_name': user.get_full_name(),
        #     'validity_date': (instance.created_at + timedelta(days=7)).strftime(
        #         '%d %B, %Y'),
        #     'download_link': download_link,
        #     'zip_filename': zip_filename
        # })
        # send_mail(subject=subject, message='', from_email=from_email, recipient_list=[to], html_message=html_content,
        #           fail_silently=True)

    # Download all files from DMS search
    @staticmethod
    @app.task(name='download-all-items-from-dms')
    def download_all_items(user, exclude_list, search_params, search_total_loop):
        doc_id_list = []

        for loop in range(0, search_total_loop):
            result = Elastic.search(search_params)

            for data in result.get('data'):
                file_id = int(data.get('id'))

                if file_id not in exclude_list:
                    doc_id_list.append(int(data.get('id')))

            start = search_params.get('start')
            length = search_params.get('length')
            search_params.update({'start': start + length})

        DMSTasks.create_zip(user, doc_id_list)

    # Download selected files from DMS search
    @staticmethod
    @app.task(name='download-selected-items-from-dms')
    def download_selected_items(user_id, doc_id_list):
        DMSTasks.create_zip(user_id, doc_id_list)
