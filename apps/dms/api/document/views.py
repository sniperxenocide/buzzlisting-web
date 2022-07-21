import datetime
import xlrd
import csv
import hashlib
import mimetypes
import cairocffi as cairo
import os
import random
import operator
import subprocess

import pathlib
import shutil
from django.db.models.aggregates import Sum

from functools import reduce
from PIL import Image, ImageFilter
from datetime import date, timedelta
from django.core.files import File

# from wand.image import Image
from PyPDF2 import PdfFileMerger
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile, UploadedFile
from django.db import transaction
from django.db.models.functions import Coalesce, Concat
from django.db.models import Value
from django.forms.models import model_to_dict
from django.http import HttpResponse
from django.http import HttpResponseRedirect
# from fpdf import FPDF
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework.views import APIView
from rest_framework import status
from django.conf import settings
from rest_framework.decorators import parser_classes
from rest_framework.response import Response
from datetime import datetime
from django.db.models import Q, Count

from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.dms.api.category.models import Category, MetaField
from apps.dms.api.dms_activity.models import DmsActivity
from apps.core.rbac.models import User, Group
from django.utils import timezone
import pytz
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.rbac.views import UserSerializer
from apps.core.socket_chat.views import redis_pub_pending, redis_checkout_doc, redis_doc_summary

from apps.dms.documents.models import TempRepository, Documents, Comments, LinkedFiles, DownloadSearchResult, \
    MetaDocumentJson, SaveSearch, WaterMarkFiles
from apps.dms.api.category.models import DocTypePermission
from apps.core.rbac.models import Group
import json

from apps.workflow.bpmn.models import InputDocument
from conf.tasks import DMSTasks
from .fpdf import *

from apps.dms.documents.elastic_search import Elastic
from reportlab.pdfgen import canvas
from PyPDF2 import PdfFileWriter, PdfFileReader
from reportlab.lib.pagesizes import letter, A4, portrait, landscape
import io


class PendingMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TempRepository
        fields = '__all__'
        # fields = ['document','creator']


class PendingMetaViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = PendingMetaSerializer
    http_method_names = ['delete', 'get', 'patch']
    queryset = TempRepository.objects.all()

    def get_queryset(self):
        user = self.request.user
        queryset = TempRepository.objects.filter(creator=user, attached=False)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        description = "File:" + instance.name + "has been removed from pending list"

        DmsActivity(user=request.user, operation="Remove Pending File",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        count = TempRepository.objects.filter(creator=request.user).count()
        redis_pub_pending(count)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CountViewSetDMS(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        checked_out = Documents.objects.filter(locked=True, locked_by=self.request.user)
        pending = TempRepository.objects.filter(creator=self.request.user)
        total = Documents.objects.filter(uploader=self.request.user)
        today = date.today()
        thirty_days = today + timedelta(days=30)
        if self.request.user.role_id == 1:
            doc_to_be_expired = Documents.objects.filter(expiry_date__range=[today, thirty_days])
        else:
            doc_to_be_expired = Documents.objects.filter(expiry_date__range=[today, thirty_days],
                                                         uploader=self.request.user)
        return Response({
            'pending_document': pending.count(),
            'checked_out_document': checked_out.count(),
            'total_document': total.count(),
            'free_space': "3 GB",
            'used_space': "5 GB",
            'doc_expired': doc_to_be_expired.count(),
        }, status=status.HTTP_201_CREATED)


class TruePendingMetaViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    # pagination_class = LargeResultsSetPagination
    serializer_class = PendingMetaSerializer
    http_method_names = ['get', 'patch']
    queryset = TempRepository.objects.all()

    def get_queryset(self):
        user = self.request.user
        queryset = TempRepository.objects.filter(creator=user, attached=True)
        return queryset

        # def perform_create(self, serializer):
        #     serializer.validated_data.update({'slug': slugify(serializer.validated_data['name'])})
        #     super(PendingMetaViewSet, self).perform_create(serializer)
        #


class DeleteAllPendingMetaViewSet(viewsets.ModelViewSet):
    serializer_class = PendingMetaSerializer
    http_method_names = ['get']
    queryset = TempRepository.objects.all()

    def list(self, request, *args, **kwargs):
        TempRepository.objects.filter(attached=False).delete()
        count = TempRepository.objects.filter(creator=request.user).count()
        redis_pub_pending(count)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        description = "All files has been removed from pending list"

        DmsActivity(user=request.user, operation="Remove Pending File",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return HttpResponse(status.HTTP_200_OK)


@api_view(['GET'])
def fileview(request, id):
    # if request.query_params.get('source') == 'workflow':
    #     print("yes --------------")
    try:
        if request.query_params.get('source') == 'workflow':
            try:
                pfile = InputDocument.objects.get(id=id)
                pdffile = settings.MEDIA_URL + pfile.file.__str__()
            except InputDocument.DoesNotExist:
                return HttpResponse(status.HTTP_404_NOT_FOUND)
        else:
            pfile = TempRepository.objects.get(id=id)
            pdffile = settings.MEDIA_URL + pfile.document.__str__()

        if pfile.extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            excel_file_path = pfile.excel_file_path
            return HttpResponse(json.dumps({'pdffile': pdffile, 'excel_file_path': excel_file_path}))
        return HttpResponse(pdffile)
    except TempRepository.DoesNotExist:
        return HttpResponse(status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def documentPreView(request, id):
    try:
        pfile = Documents.objects.get(id=id)
        pdffile = settings.MEDIA_URL + pfile.filepath.__str__()
        return HttpResponse(pdffile)
    except TempRepository.DoesNotExist:
        return HttpResponse(status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def AttachRedactedUser(request, id):
    try:
        document_info = Documents.objects.get(pk=id)
        document_info.redacted_user.clear()
        document_info.redacted_by = request.user
        for users in request.data['redacted_user']:
            user_info = User.objects.get(pk=users)
            document_info.redacted_user.add(user_info)
        document_info.save()
        return HttpResponse(status.HTTP_200_OK)
    except Documents.DoesNotExist:
        return HttpResponse(status.HTTP_404_NOT_FOUND)

# @api_view(['POST'])
# def AttachAnnotationRedaction(request, id, type):
#     print("aa", id, type, request.data['information'])
#     try:
#         document_info = Documents.objects.get(pk=id)
#         if type == 'annotation':
#             document_info.annotations = request.data['information']
#         else:
#             document_info.redactions = request.data['information']
#         document_info.save()
#         file_path = os.path.join(settings.BASE_DIR, 'media/') + document_info.filepath
#         print("filepath", file_path)
#         output_file = PdfFileWriter()
#         input_file = PdfFileReader(open(file_path, "rb"))
#         print("file", input_file)
#         page_counts = input_file.getNumPages()
#         for page_number in range(page_counts):
#             input_page = input_file.getPage(page_number)
#             for annotations in request.data['information']:
#                 print("dd", annotations['page'])
#                 if annotations['page'] == page_number:
#                     annotations_in_this_page = annotations['rectangles']
#                     for each_annotations in annotations_in_this_page:
#                         canvas_filepath = file_path#os.path.join(settings.BASE_DIR, 'media/repository/') + 'redactions.pdf'
#                         c = canvas.Canvas(file_path)
#                         c.drawString(each_annotations['x'], each_annotations['y'], "Hello World")
#                         c.save()
#                         #rect_pdf = PdfFileReader(open(canvas_filepath, "rb"))
#                         #input_page.
#             output_file.addPage(input_page)
#         fname = file_path.replace('.pdf', '') + 'redacted.pdf'
#         with open(fname, "wb") as outputStream:
#             output_file.write(outputStream)
#             outputStream.close()
#         return HttpResponse(status.HTTP_200_OK)
#     except Documents.DoesNotExist:
#         return HttpResponse(status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def AttachAnnotationRedaction(request, id, type):
    print("aa", id, type, request.data['information'])
    try:
        document_info = Documents.objects.get(pk=id)
        if type == 'annotation':
            document_info.annotations = request.data['information']
        else:
            document_info.redactions = request.data['information']
        document_info.save()
        return HttpResponse(status.HTTP_200_OK)
    except Documents.DoesNotExist:
        return HttpResponse(status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@parser_classes((JSONParser,))
def AttachMetaData(request, format=None):
    current_user = request.user
    files = request.data['files']
    meta_data = request.data['meta_data']
    tags = json.dumps(request.data['meta_data']['tags'])
    metas = json.dumps(request.data['meta_data']['metas'])
    metas_json = request.data['meta_data']['metas_json']
    source = request.data['source']
    app = request.data['app']

    tobemerged = []
    if files:
        for ob in files:
            try:
                if request.data['source'] == 'workflow':
                    dbfile = InputDocument.objects.get(id=ob)
                else:
                    dbfile = TempRepository.objects.get(id=ob)
                tobemerged.append(dbfile)
            except:
                return Response({'status': 'failed', 'message': 'File Not Found'}, status=404)
    else:
        return Response({'status': 'failed', 'message': 'File Error'}, status=520)

    filename = request.data['meta_data']['filename']
    if tobemerged:
        if source == 'workflow':
            t = tobemerged[0].file
        else:
            t = tobemerged[0].document

        mergedpdf = 'Error'
        if tobemerged[0].extension == 'application/pdf':
            mergedpdf = CallMergePdf(tobemerged, filename, settings.REPO, source)
        elif tobemerged[0].extension == 'application/msword':
            filepath = settings.MEDIA_ROOT + '/' + str(tobemerged[0].document)
            today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
            encript = hashlib.md5((filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
            final_file_path = 'repository/' + today + '/' + encript
            nfile = settings.REPO + '/' + today + '/' + encript

            if not os.path.exists(os.path.dirname(nfile)):
                os.makedirs(os.path.dirname(nfile))
            # filename = str(tobemerged[0].document)
            shutil.copyfile(filepath,
                            os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + encript + '.doc')
            pdf_file = ''
            if filepath.endswith('.doc'):
                pdf_file = filepath.replace('.doc', '.pdf')
            elif filepath.endswith('.docx'):
                pdf_file = filepath.replace('.docx', '.pdf')
            shutil.move(os.path.join(pdf_file),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + encript + '.pdf')
            mergedpdf = final_file_path + '.doc'
        elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            filepath = settings.MEDIA_ROOT + '/' + str(tobemerged[0].document)
            today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
            encript = hashlib.md5((filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
            final_file_path = 'repository/' + today + '/' + encript
            nfile = settings.REPO + '/' + today + '/' + encript

            if not os.path.exists(os.path.dirname(nfile)):
                os.makedirs(os.path.dirname(nfile))
            # filename = str(tobemerged[0].document)
            shutil.copyfile(filepath,
                            os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + encript + '.doc')
            pdf_file = ''
            if filepath.endswith('.doc'):
                pdf_file = filepath.replace('.doc', '.pdf')
            elif filepath.endswith('.docx'):
                pdf_file = filepath.replace('.docx', '.pdf')
            shutil.move(os.path.join(pdf_file),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + encript + '.pdf')
            mergedpdf = final_file_path + '.doc'
        elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':

            filepath = tobemerged[0].excel_file_path

            today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
            encript = hashlib.md5((filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
            final_file_path = 'repository/' + today + '/' + str(filepath).replace(settings.MEDIA_ROOT, '').replace(
                '/tempfiles/', '')

            date_folder = settings.REPO + '/' + today + '/'
            if not os.path.exists(os.path.dirname(date_folder)):
                os.makedirs(os.path.dirname(date_folder))

            shutil.move(os.path.join(str(filepath).replace('.xlsx', '')),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/')

            shutil.move(settings.MEDIA_ROOT + '/' + str(tobemerged[0].document),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + str(filepath).replace(
                            settings.MEDIA_ROOT, '').replace(
                            '/tempfiles/', '').replace('.xlsx', '') + "/" + str(filepath).replace(
                            settings.MEDIA_ROOT, '').replace(
                            '/tempfiles/', ''))

            mergedpdf = final_file_path

        elif tobemerged[0].extension == 'application/vnd.ms-excel':
            filepath = tobemerged[0].excel_file_path

            today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
            encript = hashlib.md5((filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
            final_file_path = 'repository/' + today + '/' + str(filepath).replace(settings.MEDIA_ROOT, '').replace(
                '/tempfiles/', '')

            date_folder = settings.REPO + '/' + today + '/'
            if not os.path.exists(os.path.dirname(date_folder)):
                os.makedirs(os.path.dirname(date_folder))

            shutil.move(os.path.join(str(filepath).replace('.xlsx', '')),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/')

            shutil.move(settings.MEDIA_ROOT + '/' + str(tobemerged[0].document),
                        os.path.join(settings.BASE_DIR, 'media/repository') + '/' + today + '/' + str(filepath).replace(
                            settings.MEDIA_ROOT, '').replace(
                            '/tempfiles/', '').replace('.xlsx', '') + "/" + str(filepath).replace(
                            settings.MEDIA_ROOT, '').replace(
                            '/tempfiles/', ''))

            mergedpdf = final_file_path
        else:
            if len(tobemerged) > 1:
                # mulitple image
                mergedpdf = CallImageToPdf(tobemerged, filename, settings.REPO)
            else:
                # single image
                mergedpdf = SaveImage(tobemerged[0], filename, settings.REPO)
                if mergedpdf == -1:
                    return Response({'status': 'failed', 'message': 'File Error'}, status=417)
        if mergedpdf == 'Error':
            return Response({'status': 'failed', 'message': 'File Error'}, status=417)
    else:
        return Response("Empty_File")
    c_date = request.data['meta_data']['created_date']
    e_date = request.data['meta_data']['expires_on']
    box_number = request.data['meta_data']['box_number']
    shelf_number = request.data['meta_data']['shelf_number']
    ap_expiry = request.data['meta_data']['action_upon_expire']
    doc_type = request.data['meta_data']['DocumentType']
    try:
        if e_date:
            if tobemerged[0].extension == 'application/msword':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    "expiry_date": e_date,
                    "action_upon_expiry": ap_expiry,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/msword',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    "expiry_date": e_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    "expiry_date": e_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.ms-excel':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    "expiry_date": e_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.ms-excel',
                    "version": '1.0',
                }
            else:
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    "expiry_date": e_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/pdf',
                    "version": '1.0',
                }
        else:
            if tobemerged[0].extension == 'application/msword':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/msword',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    "version": '1.0',
                }
            elif tobemerged[0].extension == 'application/vnd.ms-excel':
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/vnd.ms-excel',
                    "version": '1.0',
                }
            else:
                addMetaDict = {
                    "uploader": current_user,
                    "filename": filename,
                    "filepath": mergedpdf,
                    "creation_date": c_date,
                    # "box_number": box_number,
                    # "shelf_number": shelf_number,
                    "action_upon_expiry": ap_expiry,
                    "doc_type_id": int(doc_type),
                    "metadata": metas,
                    "tags": tags,
                    "watermark": 0,
                    "watermarked_by": None,
                    "extension": 'application/pdf',
                    "version": '1.0',
                }
                # uploaded_at = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d %H:%M')
        addMetaDict['source'] = source
        addMetaDict['app_id'] = app
        result = Documents.objects.create(**addMetaDict)
        if metas_json:
            MetaDocumentJson.objects.create(doc_id_id=result.pk, meta_json=metas_json)
        addMetaDict['uploader'] = current_user.get_full_name()
        addMetaDict['id'] = result.id
        addMetaDict['expiry_date'] = e_date
        addMetaDict['uploader_id'] = request.user.id
        addMetaDict['box_number'] = box_number
        addMetaDict['shelf_number'] = shelf_number
        if isinstance(result, Documents):
            # Process Metadata before saving to elastic
            # "name" : "cif", "value" : "ok", "displayname" : "Cif"  to "cif": "ok"

            tempmetas = json.loads(addMetaDict['metadata'])
            d = dict()
            for tempmata in tempmetas:
                d[tempmata['name']] = tempmata['value']

            # process
            addMetaDict.update({'metadata': json.dumps(d)})
            print("addMetaDict", addMetaDict)
            Elastic.save(addMetaDict)

        if source == 'dms':
            for ofile in files:
                try:
                    TempRepository.objects.filter(id=ofile).delete()
                except Exception as ex1:
                    return Response({'status': 'failed', 'message': 'File_Not_Delete'}, status=406)

        # DMS activity Report
        user_id = request.user.id
        file_name = addMetaDict['filename']
        operation = "Attach Metadata"
        activity_time = timezone.now()
        metadata = addMetaDict['metadata']

        docTypes = Category.objects.get(id=doc_type)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '->'.join([str(i) for i in docTypes])
        description = "File: '" + file_name + "' has been added to: " + docType \
                      + " with "
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        DmsActivity(user_id=user_id, operation=operation, ip=ip_address, description=description,
                    activity_time=activity_time, metadata=metadata, document_id=result.id).save()
        count = TempRepository.objects.filter(creator=request.user).count()
        redis_doc_summary('Attach meta data and upload success')
        redis_pub_pending(count)
        return Response({'status': 'success', 'message': 'Metadata add successfully'}, status=200)
    except Exception as ex:
        return Response({'status': 'failed', 'message': 'Sorry could not add metadata'}, status=422)


def SaveImage(data, filename, filepath):
    pdf = FPDF()
    today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
    final_file_path = 'repository/' + today + '/' + hashlib.md5(
        (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
    nfile = filepath + '/' + today + '/' + hashlib.md5(
        (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
    if not os.path.exists(os.path.dirname(nfile)):
        os.makedirs(os.path.dirname(nfile))
    # copy image
    sourcfile = settings.MEDIA_ROOT + '/' + data.document.__str__()
    try:
        margin = 10
        # shutil.copyfile(sourcfile, nfile)
        cover = Image.open(sourcfile)
        width, height = cover.size
        pdf = FPDF(unit="pt", format=[width + 2 * margin, height + 2 * margin])
        pdf.add_page()
        pdf.image(sourcfile, margin, margin)
        pdf.output(nfile + '.pdf', "F")
    except Exception as ex:
        return -1
    # os.re
    return final_file_path + '.pdf'


def CallMergePdf(data, filename, filepath, source):
    try:
        merger = PdfFileMerger(strict=False)
        for obj in data:
            if obj.extension == 'application/pdf':
                if source == 'workflow':
                    merger.append(settings.MEDIA_ROOT + '/' + obj.file.__str__())
                else:
                    merger.append(settings.MEDIA_ROOT + '/' + obj.document.__str__())
            else:
                return 'NOT_SAME_FORMAT'

        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
        # # print(today)
        final_file_path = 'repository/' + today + '/' + hashlib.md5(
            (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
        nfile = filepath + '/' + today + '/' + hashlib.md5(
            (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
        # # print(os.path.dirname(nfile))
        if not os.path.exists(os.path.dirname(nfile)):
            os.makedirs(os.path.dirname(nfile))
        merger.write(nfile + '.pdf')
        return final_file_path + '.pdf'
    except Exception as ex:
        # print(ex)
        return "Error"


def CallImageToPdf(imagelist, filename, filepath):
    today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
    final_file_path = 'repository/' + today + '/' + hashlib.md5(
        (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
    nfile = filepath + '/' + today + '/' + hashlib.md5(
        (filename + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
    if not os.path.exists(os.path.dirname(nfile)):
        os.makedirs(os.path.dirname(nfile))
    # imagelist is the list with all image filenames
    margin = 10
    # pdf = FPDF(unit="pt")
    pdf = FPDF(unit='pt')
    for image in imagelist:
        sourcfile = settings.MEDIA_ROOT + '/' + image.document.__str__()
        cover = Image.open(sourcfile)
        width, height = cover.size
        # pdf = FPDF(unit="pt", format=[width + 2 * margin, height + 2 * margin])
        pdf.add_page('P', (width + 2 * margin, height + 2 * margin))
        pdf.image(sourcfile, margin, margin)

    pdf.output(nfile + '.pdf', "F")

    return final_file_path + '.pdf'


class MetadataAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        read_only_fields = ['uploader', 'deleted_at', 'filepath', 'extension', 'creation_date', 'doc_type', 'filename']
        model = Documents


class MetadataAttachmentViewSet(CustomViewSetForQuerySet):
    serializer_class = MetadataAttachmentSerializer
    pagination_class = LargeResultsSetPagination
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = []
    queryset = Documents.objects.all()

    def perform_create(self, serializer):
        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
        tags = json.dumps('')
        migration = self.request.data.get('migration')
        doc_type = self.request.data.get('doc_type')
        file = self.request.FILES.get('file')
        metas = self.request.data.get('metas')

        if file is None:
            raise serializers.ValidationError({'detail': 'Please provide a file to upload.'})

        if self.request.data.get('tags') is not None:
            tags = self.request.data.get('tags')

        if doc_type is None:
            if migration:
                raise serializers.ValidationError({'detail': 'Please provide document type name.'})

            raise serializers.ValidationError({'detail': 'Please provide document type id.'})

        if self.request.data.get('filename') is None:
            raise serializers.ValidationError({'detail': 'Please provide filename.'})

        if migration:
            doc_type = Category.objects.get(name=doc_type)
        else:
            doc_type = Category.objects.get(pk=doc_type)

        uploaded_file = self.request.FILES.get('file')
        path = default_storage.save('repository/{}/{}'.format(today, uploaded_file.name),
                                    ContentFile(uploaded_file.read()))
        meta_data = []

        if not migration:
            fields = MetaField.objects.filter(doc=doc_type, is_deleted=False)

            if fields.count():
                for field in fields:
                    field_data = self.request.data.get(str(field))

                    if field_data is not None:
                        meta_data.append({
                            'name': field.title,
                            'value': field_data,
                            'displayname': field.displayname
                        })

        if migration:
            meta_data = metas
        else:
            print('okay')
            meta_data = json.dumps(meta_data)

        elastic_meta_data = dict()

        for data in json.loads(meta_data):
            elastic_meta_data[data['name']] = data['value']

        if not migration:
            latest = serializer.save(uploader=self.request.user, filepath=path, extension='application/pdf',
                                     metadata=meta_data, tags=tags, published=True, creation_date=today,
                                     doc_type=doc_type,
                                     filename=self.request.data.get('filename'))
        else:
            latest = serializer.save(uploader=self.request.user, filepath=path, extension='application/pdf',
                                     metadata=meta_data, tags=tags, published=True,
                                     creation_date=self.request.data.get('creation_date'), doc_type=doc_type,
                                     filename=self.request.data.get('filename'))

        parent_file_id = self.request.data.get('parent')

        if parent_file_id and migration:
            data_for_elastic = model_to_dict(Documents.objects.get(pk=parent_file_id))
            data_for_elastic.update({'version': self.request.data.get('version')})
        else:
            data_for_elastic = model_to_dict(latest)

        data_for_elastic.update({'metadata': json.dumps(elastic_meta_data)})
        data_for_elastic.update({'uploader_id': self.request.user.id})
        data_for_elastic.update({'uploader': self.request.user.get_full_name()})
        data_for_elastic.update({'doc_type_id': latest.doc_type.id})
        Elastic.save(data_for_elastic)

        return Response({'details': model_to_dict(latest)})

    def update(self, request, *args, **kwargs):
        pass

    def destroy(self, request, *args, **kwargs):
        pass

    def list(self, request, *args, **kwargs):
        pass

        # class DeleteMetaAttachmentSerialization(serializers.ModelSerializer):
        #     class Meta:
        #         model = Documents
        #         fields = ['id', 'filepath']

        # class DeleteDocumentViewSet(viewsets.ModelViewSet):
        #     # permission_classes = [permissions.DjangoModelPermissions]
        #     serializer_class = DeleteMetaAttachmentSerialization
        #     http_method_names = ['delete']
        #
        #     def get_queryset(self):
        #         docid = self.request.query_params.get('doc_id', None)
        #         if docid is not None:
        #             queryset = Documents.objects.filter(document_id=docid)
        #         else:
        #             queryset = Documents.objects.all()
        #         return queryset
        #
        #     def destroy(self, request, *args, **kwargs):
        #         try:
        #             doc = Documents.objects.get(**kwargs)
        #             os.remove(doc.filepath)
        #             Elastic.delete(doc.id)
        #             doc.delete()
        #             return HttpResponse(status.HTTP_204_NO_CONTENT)
        #         except Documents.DoesNotExist:
        #             return HttpResponse(status.HTTP_404_NOT_FOUND)


class SyncDataWithSearchEngineSerializer(serializers.ModelSerializer):
    class Meta:
        fields = []
        model = Documents


class SyncDataWithSearchEngineViewSet(CustomViewSetForQuerySet):
    serializer_class = SyncDataWithSearchEngineSerializer
    pagination_class = LargeResultsSetPagination
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = []
    queryset = Documents.objects.none()

    def create(self, request, *args, **kwargs):
        documents = Documents.objects.all()

        for document in documents:
            elastic_meta_data = dict()

            for data in json.loads(document.metadata):
                elastic_meta_data[data['name']] = data['value']

            data_for_elastic = model_to_dict(document)
            data_for_elastic.update({'metadata': json.dumps(elastic_meta_data)})
            data_for_elastic.update({'uploader_id': self.request.user.id})
            data_for_elastic.update({'uploader': self.request.user.get_full_name()})
            data_for_elastic.update({'doc_type_id': document.doc_type.id})
            Elastic.save(data_for_elastic)

        return Response({'detail': 'Data sync done.'})

    def list(self, request, *args, **kwargs):
        pass

    def update(self, request, *args, **kwargs):
        pass

    def destroy(self, request, *args, **kwargs):
        pass


class CommentsSerialization(serializers.ModelSerializer):
    comment_by = UserSerializer(many=False, read_only=True, source='commentor')

    class Meta:
        model = Comments
        fields = ['document', 'commentor', 'comment_by', 'comment', 'created_at']


class CommentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = CommentsSerialization

    def get_queryset(self):

        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            queryset = Comments.objects.filter(document_id=docid)
        else:
            queryset = Comments.objects.all()
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        doc = Documents.objects.get(id=serializer.data['document'])
        description = 'Document: {} has been commented by {}'.format(doc.filename,
                                                                     self.request.user.get_full_name())
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Comment",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ViewDocumentSerialization(serializers.ModelSerializer):
    uploaded_by = UserSerializer(many=False, read_only=True, source='uploader')
    doctype = serializers.SerializerMethodField('get_doc_type')
    app_number = serializers.StringRelatedField(read_only=True, source='app')

    def get_doc_type(self, obj):
        docTypes = Category.objects.get(id=obj.doc_type_id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '->'.join([str(i) for i in docTypes])
        return docType

    # lockedby = UserSerializer(many=False, read_only=True, source='locked_by')

    class Meta:
        model = Documents
        fields = '__all__'


class AuditTrail:
    def __init__(self, user, doc, remote_addr, operation, operation_name):
        self.user = user
        self.doc = doc
        self.remote_addr = remote_addr
        self.operation = operation
        self.operation_name = operation_name

    def add_audit(self):
        user_id = self.user.id
        file_name = self.doc.filename
        version = str(self.doc.version)
        ip = self.remote_addr
        activity_time = timezone.now()
        operation = self.operation
        # description = "File: '" + file_name + "(" + version + ")' has been " + self.operation_name
        description = "File: '" + file_name + " has been " + self.operation_name + ' '
        if operation == "Edit Metadata":
            DmsActivity(user_id=user_id, operation=operation, metadata=self.doc.metadata, ip=ip, description=description
                        , document_id=self.doc.id).save()
        else:
            DmsActivity(user_id=user_id, operation=operation, ip=ip, description=description,
                        activity_time=activity_time).save()


class DocumentOperationSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(many=False, read_only=True, source='uploader')

    class Meta:
        model = Documents
        fields = '__all__'


class DocumentOperationViewSet(viewsets.ModelViewSet):
    serializer_class = ViewDocumentSerialization


# return document details
class ViewDocumentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = ViewDocumentSerialization

    def make_lock(self, instance, check_out=True):
        instance.locked = True if check_out else False
        instance.locked_by = self.request.user if check_out else None
        instance.locked_at = timezone.now() if check_out else None
        instance.save()
        redis_checkout_doc('Checkout docs changes received!')
        return instance

    def make_archive(self, instance, archive=True):
        instance.archived = True if archive else False
        instance.archived_by = self.request.user if archive else None
        instance.archived_at = timezone.now() if archive else None
        instance.save()
        return instance

    def document_operation(self, permission_id, operation):
        instance = self.get_object()
        parent = instance.parent
        parent_id = parent.id if parent else ''
        operation_title = {
            'download': 'download',
            'check_in': 'checked in',
            'check_out': 'check out',
            'archive': 'archive',
            'restore_archive': 'restore archive',
            # 'print': 'print'
        }

        if self.request.user.role.permission.filter(pk=permission_id).count() or self.request.user.role.id == 1:

            if parent:
                if operation == 'check_out':
                    self.make_lock(parent)

                if operation == 'check_in':
                    self.make_lock(parent, False)

                if operation == 'archive':
                    self.make_archive(parent)

                if operation == 'restore_archive':
                    self.make_archive(parent, False)

            if parent is not None:
                all_files = Documents.objects.filter(Q(parent=parent))
                if all_files.count():
                    with transaction.atomic():
                        for single_file in all_files:
                            if operation == 'check_out':
                                self.make_lock(single_file)

                            if operation == 'check_in':
                                self.make_lock(single_file, False)

                            if operation == 'archive':
                                self.make_archive(single_file)

                            if operation == 'restore_archive':
                                self.make_archive(single_file, False)

            if operation == 'check_out':
                instance = self.make_lock(instance)
                description = "File: '" + instance.filename + "' has been Checked Out"
                x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = self.request.META.get('REMOTE_ADDR')
                DmsActivity(user_id=self.request.user.id, operation="Check out", ip=ip_address,
                            description=description,
                            activity_time=timezone.now()).save()

            if operation == 'check_in':
                instance = self.make_lock(instance, False)
                description = "File: '" + instance.filename + "' has been Checked in"
                x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = self.request.META.get('REMOTE_ADDR')
                DmsActivity(user_id=self.request.user.id, operation="Check in", ip=ip_address,
                            description=description,
                            activity_time=timezone.now()).save()

            if operation == 'archive':
                instance = self.make_archive(instance)
                description = "File: '" + instance.filename + "' has been Archived"
                x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = self.request.META.get('REMOTE_ADDR')
                DmsActivity(user_id=self.request.user.id, operation="Archive", ip=ip_address,
                            description=description,
                            activity_time=timezone.now()).save()

            if operation == 'restore_archive':
                instance = self.make_archive(instance, False)
                description = "File: '" + instance.filename + "' has been Restored from Archive"
                x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = self.request.META.get('REMOTE_ADDR')
                DmsActivity(user_id=self.request.user.id, operation="Restore Archive",
                            ip=ip_address,
                            description=description,
                            activity_time=timezone.now()).save()

            Elastic.update(RestoreFileListViewSet.set_instance(instance), parent_id)
            return Response({'detail': 'Document {} successfully.'.format(operation_title[operation])})
        raise serializers.ValidationError(
            {'detail': "User has no permission to {} this document.".format(operation_title[operation])})

    def get_queryset(self):
        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            queryset = Documents.objects.filter(Q(id=docid) | Q(parent=docid)).order_by(
                Coalesce('version', 'parent').desc())
        else:
            queryset = Documents.objects.all()
        return queryset

    def update(self, request, *args, **kwargs):
        permissions = request.user.role.permission.values_list('id', flat=True)
        # edit metadata permission
        if 16 in permissions:
            def docupdate(doc):
                doc.filename = request.data['filename']
                doc.tags = json.dumps(request.data['tags'])
                doc.box_number = request.data['box_number']
                doc.shelf_number = request.data['shelf_number']
                doc.metadata = json.dumps(request.data['meta_data'])
                if request.data['creation_date']:
                    doc.creation_date = request.data['creation_date']

                if request.data['expiry_date']:
                    doc.expiry_date = request.data['expiry_date']

                doc.action_upon_expiry = request.data['action_upon_expire']
                doc.doc_type_id = int(request.data['doc_type'])
                doc.save()

            doc = Documents.objects.get(**kwargs)
            docId = doc.parent_id

            docupdate(doc)
            if docId is not None:
                parent = Documents.objects.get(id=docId)
                docupdate(parent)
                documents = Documents.objects.filter(parent_id=docId)
                for document in documents:
                    docupdate(document)

            tempmetas = json.loads(doc.metadata)
            d = dict()
            for tempmata in tempmetas:
                d[tempmata['name']] = tempmata['value']

            # process
            doc.metadata = json.dumps(d)

            Elastic.update(doc, doc.parent_id)

            operation = "Edit Metadata"
            operation_name = "Edited"
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[-1].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            AuditTrail(request.user, doc, ip_address, operation, operation_name).add_audit()
            return HttpResponse(status=205)
        else:
            msg = "User has no permission to update metadata"
            return HttpResponse(msg, status.HTTP_401_UNAUTHORIZED)

    def destroy(self, request, *args, **kwargs):
        permissions = request.user.role.permission.values_list('id', flat=True)
        # delete document permission
        if 12 in permissions:
            try:
                # doc = Documents.objects.get(**kwargs)
                #
                # def docdelete(doc):
                #     doc.deleted = True
                #     doc.deleted_by = request.user
                #     doc.deleted_at = datetime.now()
                #     doc.save()
                #
                #
                # # def docdelete(doc):
                # #     doc.deleted = True
                # #     doc.deleted_by = request.user
                # #     doc.deleted_at = datetime.now()
                # #     doc.save()
                # # docId = doc.parent_id
                # # docdelete(doc)
                # # if docId is None:
                # #     parent = Documents.objects.get(id=docId)
                # #     docdelete(parent)
                # #     documents = Documents.objects.filter(parent_id=docId)
                # #     for document in documents:
                # #         docdelete(document)
                # #     Elastic.delete(doc.id)
                # if doc.parent_id:
                #     doc = Documents.objects.filter(Q(id=doc.parent_id) | Q(parent=doc.parent_id)).order_by(
                #         Coalesce('version', 'parent').desc()).first()
                #     docdelete(doc)
                #     # process for elastic Search
                #
                #     tempmetas = json.loads(doc.metadata)
                #     d = dict()
                #     for tempmata in tempmetas:
                #         d[tempmata['name']] = tempmata['value']
                #
                #     # process
                #     doc.metadata = json.dumps(d)
                #     Elastic.update(doc, doc.parent_id)
                # else:
                #     docId = doc.parent_id
                #     documents = Documents.objects.filter(parent_id=doc.id)
                #     for document in documents:
                #         docdelete(document)
                #     Elastic.delete(doc.id)
                #     docdelete(doc)
                doc = Documents.objects.get(**kwargs)
                version = str(doc.version)

                def docdelete(doc):
                    doc.deleted = True
                    doc.deleted_by = request.user
                    doc.deleted_at = datetime.now()
                    doc.save()

                docdelete(doc)
                # def docdelete(doc):
                #     doc.deleted = True
                #     doc.deleted_by = request.user
                #     doc.deleted_at = datetime.now()
                #     doc.save()
                # docId = doc.parent_id
                # docdelete(doc)
                # if docId is None:
                #     parent = Documents.objects.get(id=docId)
                #     docdelete(parent)
                #     documents = Documents.objects.filter(parent_id=docId)
                #     for document in documents:
                #         docdelete(document)
                #     Elastic.delete(doc.id)
                if doc.parent_id:
                    doc = Documents.objects.filter(Q(id=doc.parent_id) | Q(parent=doc.parent_id)).order_by(
                        Coalesce('version', 'parent').desc()).first()

                    # process for elastic Search

                    tempmetas = json.loads(doc.metadata)
                    d = dict()
                    for tempmata in tempmetas:
                        d[tempmata['name']] = tempmata['value']

                    # process
                    doc.metadata = json.dumps(d)

                    Elastic.update(doc, doc.parent_id)
                else:
                    docId = doc.parent_id
                    documents = Documents.objects.filter(parent_id=doc.id)
                    for document in documents:
                        docdelete(document)

                    # process for elastic Search
                    tempmetas = json.loads(doc.metadata)
                    d = dict()
                    for tempmata in tempmetas:
                        d[tempmata['name']] = tempmata['value']

                    # process
                    doc.metadata = json.dumps(d)
                    Elastic.update(doc, doc.parent_id)

                # operation = "Delete"
                # operation_name = "deleted"
                # AuditTrail(request.user, doc, request.META['REMOTE_ADDR'], operation, operation_name).add_audit()
                # return HttpResponse(status.HTTP_204_NO_CONTENT)
                description = "File: '" + doc.filename + "(" + version + ")' has been Deleted"
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = request.META.get('REMOTE_ADDR')
                DmsActivity(user=request.user, operation="Delete Document",
                            ip=ip_address,
                            description=description, activity_time=timezone.now()).save()
                return HttpResponse(status.HTTP_204_NO_CONTENT)
            except Documents.DoesNotExist:
                return HttpResponse(status.HTTP_404_NOT_FOUND)
        else:
            msg = "User has no permission to delete this document"
            return HttpResponse(msg, status.HTTP_401_UNAUTHORIZED)

    def retrieve(self, request, *args, **kwargs):
        operation = self.request.query_params.get('operation')
        instance = self.get_object()
        permission_id = {
            'check_out': 13,
            'check_in': 13,
            'archive': 24,
            'restore_archive': 24
        }

        if operation is None:
            raise serializers.ValidationError({'detail': 'You have to set "operation" parameter.'})

        if operation == 'download':
            if self.request.user.role.permission.filter(pk=14).count() or self.request.user.role.id == 1:

                if default_storage.exists(instance.filepath):

                    if instance.extension != 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                        response = HttpResponse(default_storage.open(instance.filepath).read())
                    else:
                        response = HttpResponse(
                            default_storage.open(instance.filepath + "/" + instance.filepath.split(r'/')[-1]).read())
                    file_name = instance.filename.replace(' ', '_').lower()
                    version = '_ver' + instance.version.__str__()

                    if instance.extension == 'application/msword':
                        extension = '.doc'
                    elif instance.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        extension = '.docx'
                    else:
                        extension = mimetypes.guess_extension(instance.extension)
                    response['Content-Disposition'] = 'attachment; filename=' + file_name + version + extension
                    x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(',')[-1].strip()
                    else:
                        ip_address = self.request.META.get('REMOTE_ADDR')
                    AuditTrail(self.request.user, instance, ip_address, "Download",
                               "downloaded").add_audit()
                    return response
                else:
                    if instance.extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                        file_path = str(instance.filepath).replace('.xlsx', '') + "/" + instance.filepath.split(r'/')[
                            -1]
                        print(file_path)
                        version = '_ver' + instance.version.__str__()
                        extension = '.xls'
                        if default_storage.exists(file_path):
                            response = HttpResponse(default_storage.open(file_path).read())
                            filename = instance.filename.replace(' ', '-').lower()
                            response['Content-Disposition'] = 'attachment; filename={}{}{}'.format(filename, version,
                                                                                                   extension)
                            return response

            raise serializers.ValidationError({'detail': "User has no permission to download this document"})

        return self.document_operation(permission_id=permission_id[operation], operation=operation)


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documents
        fields = ['id', 'doc_type', 'filename', 'uploader', 'filepath']


class LinkedDocumentSerialization(serializers.ModelSerializer):
    document = DocumentSerializer(many=False, read_only=True, source='linkfile')

    class Meta:
        model = LinkedFiles
        fields = ['sourcefile', 'linkfile', 'document', 'id']


class LinkedDocumentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = LinkedDocumentSerialization
    queryset = LinkedFiles.objects.all()

    # http_method_names = ['get', 'post', 'delete']

    # queryset = LinkedFiles.objects.all()
    def list(self, request, *args, **kwargs):
        linkid = self.request.query_params.get('link_id', None)
        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            queryset = LinkedFiles.objects.filter(sourcefile_id=docid)
            data = self.get_serializer(queryset, many=True)
        elif linkid is not None:
            queryset = LinkedFiles.objects.filter(linkfile_id=linkid)
            data = self.get_serializer(queryset, many=True)
        else:
            queryset = LinkedFiles.objects.all()
            data = self.get_serializer(queryset, many=True)
        return Response(data.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        description = "File: '" + instance.linkfile.filename + " has been Unlinked from File: '" + \
                      instance.sourcefile.filename + "'"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Unlink Document",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # def get_queryset(self):
    #     docid = self.request.query_params.get('doc_id', None)
    #     if docid is not None:
    #         queryset = LinkedFiles.objects.filter(linkfile_id=docid)
    #     else:
    #         queryset = LinkedFiles.objects.all()
    #     return queryset

    def perform_create(self, serializer):
        # super(LinkedDocumentViewSet, self).perform_create(serializer)
        link_files = self.request.data.getlist('linkfile')
        linked_with = self.request.query_params.get('doc_id')
        linked_file_name = Documents.objects.get(id=linked_with).filename
        file_names = []
        for l_f in link_files:
            file_names.append(Documents.objects.get(id=l_f).filename)
        file_name = ', '.join(file_names)
        operation = "Related Files"
        activity_time = timezone.now()
        description = "File: '" + file_name + "' has been linked with file : '" + linked_file_name + "' by: '" + \
                      self.request.user.get_full_name() + "'"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')

        LinkedFiles.objects.bulk_create(
            [LinkedFiles(sourcefile=serializer.validated_data['sourcefile'], linkfile_id=lf,
                         attach_by=self.request.user, attach_date=datetime.now()) for lf in
             link_files])

        DmsActivity(user=self.request.user, operation=operation, ip=ip_address, description=description,
                    activity_time=activity_time).save()


class Versions(viewsets.ModelViewSet):
    serializer_class = ViewDocumentSerialization
    http_method_names = ['delete', 'get', 'post']

    def get_queryset(self):
        docid = self.request.query_params.get('parent_id', None)
        if docid is not None:
            queryset = Documents.objects.filter(Q(parent=docid) | Q(id=docid)).order_by(
                Coalesce('version', 'parent').desc())
        else:
            queryset = None
        return queryset

    def create(self, request, *args, **kwargs):
        permissions = request.user.role.permission.values_list('id', flat=True)

        try:
            docid = self.request.query_params.get('doc_id')
            parent = Documents.objects.only('parent_id').get(id=docid).parent_id
            if parent is None:
                parent = docid
            current_user = request.user
            if request.FILES is None:
                return HttpResponse({'status': 'failed', 'message': 'Sorry Could not upload version'}, status=404)
            else:
                files = [request.FILES.get('uploadfile')]
                for f in files:
                    client_upload = TempRepository.objects.create(
                        document=f,
                        name=f.name,
                        extension=f.content_type,
                        creator=current_user
                    )
                    dbfile = TempRepository.objects.get(id=client_upload.id)
                    if dbfile.extension == 'application/pdf':
                        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
                        filepath = settings.REPO + '/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.pdf'
                        final_file_path = 'repository' + '/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.pdf'
                        if not os.path.exists(os.path.dirname(filepath)):
                            os.makedirs(os.path.dirname(filepath))

                        sourcfile = settings.MEDIA_ROOT + '/' + dbfile.document.__str__()
                        shutil.move(sourcfile, os.path.join(settings.BASE_DIR,
                                                            'media/repository' + '/' + today + '/' + hashlib.md5(
                                                                files[0].name.encode("utf")).hexdigest() + '.pdf'))
                        dbfile.delete()
                    elif dbfile.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
                        filepath = settings.REPO + '/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.docx'

                        if not os.path.exists(os.path.dirname(filepath)):
                            os.makedirs(os.path.dirname(filepath))
                        sourcfile = settings.MEDIA_ROOT + '/' + dbfile.document.__str__()
                        doc_file = os.path.join(settings.BASE_DIR, 'media/repository' + '/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.docx')

                        shutil.move(sourcfile, doc_file)

                        output_dir = os.path.join(settings.BASE_DIR, 'media/repository', today)
                        input_file = os.path.join(settings.BASE_DIR, 'media/repository', today,
                                                  hashlib.md5(files[0].name.encode("utf")).hexdigest() + '.docx')
                        print("output dir? =", output_dir)
                        print("input file? =", input_file)
                        # p = os.system(command)
                        p = subprocess.Popen(
                            ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', output_dir])
                        final_file_path = 'repository/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.docx'
                        dbfile.delete()
                    elif dbfile.extension == 'application/msword':
                        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')
                        filepath = settings.REPO + '/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest()

                        if not os.path.exists(os.path.dirname(filepath)):
                            os.makedirs(os.path.dirname(filepath))
                        sourcfile = settings.MEDIA_ROOT + '/' + dbfile.document.__str__()

                        shutil.move(sourcfile, os.path.join(settings.BASE_DIR,
                                                            'media/repository' + '/' + today + '/' + hashlib.md5(
                                                                files[0].name.encode("utf")).hexdigest() + '.doc'))

                        output_dir = os.path.join(settings.BASE_DIR, 'media/repository', today)
                        input_file = os.path.join(settings.BASE_DIR, 'media/repository', today,
                                                  hashlib.md5(files[0].name.encode("utf")).hexdigest() + '.doc')
                        print("output dir? =", output_dir)
                        print("input file? =", input_file)
                        # p = os.system(command)
                        p = subprocess.Popen(
                            ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', output_dir])
                        final_file_path = 'repository/' + today + '/' + hashlib.md5(
                            files[0].name.encode("utf")).hexdigest() + '.doc'
                        dbfile.delete()
                    elif dbfile.extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':

                        today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d')

                        encript = hashlib.md5((dbfile.document.__str__() + datetime.now(
                            pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
                        filepath = settings.REPO + '/' + today + '/' + encript + '/'
                        if not os.path.exists(os.path.dirname(settings.REPO + '/' + today + '/')):
                            os.makedirs(os.path.dirname(settings.REPO + '/' + today + '/'))
                        if not os.path.exists(os.path.dirname(settings.REPO + '/' + today + '/' + encript + '/')):
                            os.makedirs(os.path.dirname(settings.REPO + '/' + today + '/' + encript + '/'))
                        sourcfile = settings.MEDIA_ROOT + '/' + dbfile.document.__str__()

                        shutil.move(sourcfile, os.path.join(settings.BASE_DIR,
                                                            'media/repository' + '/' + today + '/' + encript + '/' +
                                                            encript + '.xlsx'))

                        wb_filepath = filepath + encript + '.xlsx'

                        workbook = xlrd.open_workbook(wb_filepath)
                        all_worksheets = workbook.sheet_names()
                        count = 0
                        for worksheet_name in all_worksheets:
                            worksheet = workbook.sheet_by_name(worksheet_name)
                            if worksheet.nrows > 0:
                                count = count + 1
                                with open('{}.csv'.format(encript + "_x_p_c" + str(count)),
                                          "w",
                                          newline="") as your_csv_file:
                                    wr = csv.writer(your_csv_file, dialect='excel')

                                    for rownum in range(worksheet.nrows):
                                        wr.writerow(worksheet.row_values(rownum))
                                    shutil.move(
                                        '{}.csv'.format(encript + "_x_p_c" + str(count)),
                                        os.path.join(settings.BASE_DIR,
                                                     'media/repository') + "/" + today + '/' + encript)

                        final_file_path = 'repository/' + today + '/' + encript + '.xlsx'
                        dbfile.delete()
                    else:
                        final_file_path = SaveImage(dbfile, files[0].name, settings.REPO)

                    # TempRepository.objects.filter(id=client_upload.id).delete()

                    if final_file_path == -1:
                        return Response({'status': 'failed', 'message': 'Sorry Could not upload version'},
                                        status=422)
                    if request.data['expiry_date']:
                        if dbfile.extension == 'application/msword':
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "expiry_date": request.data['expiry_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/msword',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }
                        elif dbfile.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "expiry_date": request.data['expiry_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }
                        else:
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "expiry_date": request.data['expiry_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/pdf',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }

                    else:
                        if dbfile.extension == 'application/msword':
                            # print(request.data['expiry_date'])
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/msword',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }
                        elif dbfile.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                            # print(request.data['expiry_date'])
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }
                        elif dbfile.extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                            # print(request.data['expiry_date'])
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }
                        else:
                            addMetaDict = {
                                "uploader": current_user,
                                "filename": request.data['filename'],
                                "filepath": final_file_path,
                                "creation_date": request.data['creation_date'],
                                "action_upon_expiry": request.data['action_upon_expire'],
                                "doc_type_id": int(request.data['doc_type']),
                                "metadata": request.data['metadata'],
                                "tags": request.data['tags'],
                                "extension": 'application/pdf',
                                "version": request.data['version'],
                                "version_uploader_id": request.data['version_uploader_id'],
                                "parent_id": parent,
                            }

                    # here
                    parent = Documents.objects.get(id=parent)
                    addMetaDict["source"] = parent.source
                    addMetaDict["app_id"] = parent.app_id

                    result = Documents.objects.create(**addMetaDict)
                    addMetaDict['uploader'] = current_user.get_full_name()
                    addMetaDict['uploader_id'] = request.user.id
                    addMetaDict['id'] = result.id

                    if request.data['comment']:
                        commentDict = {
                            "comment": request.data['comment'],
                            "commentor_id": request.user.id,
                            "document_id": result.id,
                        }
                        comment = Comments.objects.create(**commentDict)
                        addMetaDict['comment'] = commentDict

                    doc = Documents.objects.get(id=result.id)
                    # process for elastic Search

                    tempmetas = json.loads(doc.metadata)
                    d = dict()
                    for tempmata in tempmetas:
                        d[tempmata['name']] = tempmata['value']

                    # process
                    doc.metadata = json.dumps(d)

                    Elastic.update(doc, result.parent_id)

                    user_id = addMetaDict["version_uploader_id"]
                    file_name = addMetaDict['filename']
                    version_number = addMetaDict['version']
                    operation = "Version Update"
                    activity_time = timezone.now()
                    description = "File: '" + file_name + "' has new a version: '" + version_number + "'"
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(',')[-1].strip()
                    else:
                        ip_address = request.META.get('REMOTE_ADDR')
                    DmsActivity(user_id=user_id, operation=operation, ip=ip_address, description=description,
                                activity_time=activity_time).save()
                    # dbfile.delete()
            return HttpResponse(json.dumps(addMetaDict))
        except Exception as ex:
            print(ex)
            return Response({'status': 'failed', 'message': 'Sorry Could not upload version'}, status=422)


class VersionControlSerialization(serializers.ModelSerializer):
    class Meta:
        model = Documents
        fields = ['filename', 'parent', 'version', 'version_uploader', 'uploaded_at']


class DocumentListSerializer(serializers.ModelSerializer):
    versions = serializers.SerializerMethodField('get_docversions')

    class Meta:
        model = Documents
        fields = ['id', 'doc_type', 'filename', 'creation_date', 'expiry_date', 'extension', 'uploader', 'version',
                  'versions', 'parent', 'locked', 'locked_by', 'published', 'thumbnail']

    def get_docversions(self, obj):
        return list(Documents.objects.filter(parent_id=obj.id).values('version', 'id').order_by('version')[::-1])


class DocumentListViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = DocumentListSerializer
    http_method_names = ['get']

    def get_queryset(self):
        user = self.request.user
        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            if self.request.user.role.id == 1:
                queryset = Documents.objects.filter(doc_type_id=docid, parent__isnull=True, deleted=False,
                                                    archived=False).order_by('-id')
            elif hasDocPermission(user, docid):
                queryset = Documents.objects.filter(doc_type_id=docid, parent__isnull=True, deleted=False,
                                                    archived=False).exclude(~Q(locked_by=user), locked=True).order_by(
                    '-id')
            else:
                queryset = []
        else:
            queryset = []

        return queryset


def hasDocPermission(userid, doctype):
    grps = Group.objects.filter(user=userid)
    if grps.count():
        allowgrp = DocTypePermission.objects.filter(doc_id=doctype).values('groups').filter(groups__in=grps)
        if allowgrp.count():
            return True
    return False


def hasSearchPermission(userid, doctype, docid):
    grps = Group.objects.filter(user=userid)
    user = User.objects.filter(id=userid).values_list('role_id', flat=True)[0]
    # parent_id = Documents.objects.filter(parent_id=docid)
    # print("PI", parent_id)
    locked = Documents.objects.get(id=docid).locked
    locked_by = Documents.objects.get(id=docid).locked_by_id
    if user == 1:
        return True
    if grps.count():
        allowgrp = DocTypePermission.objects.filter(doc_id=doctype).values('groups').filter(groups__in=grps)
        if allowgrp.count():
            if not locked:
                return True
            if locked:
                if str(userid) == str(locked_by):
                    return True
    return False


api_view(['GET'])


@parser_classes((JSONParser,))
class generateThumbnail(APIView):
    def get(self, request, *args, **kwargs):
        obj = TempRepository.objects.filter(thumbnail='')
        for ob in obj:
            sourcefile = settings.MEDIA_ROOT + '/' + str(ob.document) + '[0]'
            thumb = settings.MEDIA_ROOT + '/' + str(ob.id) + '.jpg'
            with Image(filename=sourcefile) as img:
                img.save(filename=thumb)
                # Resizing this image
            with Image(filename=thumb) as img:
                img.resize(200, 150)
                img.save(filename=thumb)
            f = pathlib.Path(thumb)
            ob.thumbnail = File(f)
            ob.save()

        Response({'received data': request.data})

        #     # print("%s -thumbnail 222 %s/%s[0] %s/%s" % (
        #         settings.CONVERT_BINARY, settings.MEDIA_ROOT, ob.document, settings.MEDIA_ROOT, str(ob.id)+'.png'))
        #     command = "%s -thumbnail 222 %s/%s[0] %s/%s" % (
        #         settings.CONVERT_BINARY, settings.MEDIA_ROOT, ob.document, settings.MEDIA_ROOT, str(ob.id)+'.png')
        # # time.sleep(2)
        #
        #     # print((subprocess.Popen(command,
        #                           shell=True,
        #                           stdin=subprocess.PIPE,
        #                           stdout=subprocess.PIPE,
        #                           stderr=subprocess.PIPE,
        #                           )).communicate())

        # Response({'received data': request.data})


class ViewUserDocumentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = ViewDocumentSerialization
    http_method_names = ['get']

    def get_queryset(self):
        uid = self.request.query_params.get('user', None)
        docid = self.request.query_params.get('docid', None)
        doc = Documents.objects.get(id=docid)
        parentid = doc.id if doc.parent_id is None else doc.parent_id
        if uid is not None:
            grps = Group.objects.filter(user=uid)
            # queryset = ((Documents.objects.filter(
            #     Q(uploader_id=uid, parent__isnull=True, archived=False) |
            #     Q(doc_type__document_permission__groups_id__in=grps)).exclude(pk=parentid)).distinct()).exclude(
            #     linkedfile__sourcefile=docid)
            queryset = []
            parents = []
            documents = ((Documents.objects.filter(
                Q(uploader_id=uid, archived=False) |
                Q(doc_type__document_permission__groups_id__in=grps)).exclude(pk=parentid)).distinct()).exclude(
                linkedfile__sourcefile=docid)
            for document in documents:
                parent = document.parent
                if parent:
                    doc = documents.filter(parent=parent).order_by('-version').first()
                    parents.append(parent.id)
                else:
                    doc = document
                if doc not in queryset:
                    if doc.id not in parents:
                        queryset.append(doc)
        else:
            queryset = None
        return queryset


class RestoreFileListSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField('getusername')

    def getusername(self, obj):
        user = User.objects.get(id=obj.uploader_id)
        username = user.get_full_name()
        return username

    class Meta:
        model = Documents
        fields = '__all__'
        # fields = ['id', 'username' 'filename', 'creation_date', 'expiry_date', 'extension', 'version', 'deleted']


class RestoreFileListViewSet(viewsets.ModelViewSet):
    pagination_class = LargeResultsSetPagination
    serializer_class = RestoreFileListSerializer
    http_method_names = ['get', 'patch']
    model = Documents
    queryset = Documents.objects.filter(deleted=True)
    change_keys = {
        'uploader': 'uploader__first_name'
    }
    search_keywords = ['filename', 'version', 'uploader__first_name']

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        perm_list = self.request.user.role.permission.values_list('id', flat=True)
        user = self.request.query_params.get('user', None)
        if user is None:
            if self.request.user.role.id == 1:
                queryset = self.model.objects.filter(deleted=True)
            else:
                if 21 in perm_list:
                    queryset = self.model.objects.filter(deleted=True)
        else:
            queryset = self.model.objects.filter(uploader=user, deleted=True)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(uploaded_at__range=[date_from, date_to])

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()

        return queryset

    def restore_file(self, instances):
        with transaction.atomic():
            versions = []
            filenames = []
            for instance in instances:
                instance.deleted = False
                instance.deleted_by = None
                instance.deleted_at = None
                # versions.append(instance.version)
                filenames.append(instance.filename)
                instance.save()
                # version_number = ", ".join(versions)

    @staticmethod
    def set_instance(instance):
        if instance.metadata != '' or instance.metadata:
            temp_metas = json.loads(instance.metadata)
            meta_dict = dict()

            for meta in temp_metas:
                meta_dict[meta['name']] = meta['value']

            instance.metadata = json.dumps(meta_dict)
        return instance

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        parent_file = instance.parent
        temp_instance = instance

        if parent_file:
            self.restore_file([parent_file, instance])
            Elastic.update(RestoreFileListViewSet.set_instance(temp_instance), parent_file.id)

        if not parent_file:
            versions = Documents.objects.filter(parent_id=instance.id, deleted=True).order_by('-version')
            last_version = versions.first()

            for version in versions:
                self.restore_file([version])

            self.restore_file([instance])
            Elastic.update(RestoreFileListViewSet.set_instance(temp_instance), '')

            if last_version:
                self.restore_file([last_version])
                Elastic.update(RestoreFileListViewSet.set_instance(last_version), instance.id)

        description = "File: '" + instance.filename + "(" + str(instance.version) + ")' has been restored "
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Restore File",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        serializer = RestoreFileListSerializer(instance)
        return Response(serializer.data)


@api_view(['HEAD', 'GET'])
def read(request, id):
    try:
        docobj = Documents.objects.get(id=id)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="' + docobj.filename + '.pdf"'
        file = docobj.filepath.__str__()
        # contents = Path(file).read_text()
        # p = canvas.Canvas(response)
        # p.drawString(100, 100, "Hello world.")
        # p.showPage()
        # p.save()
        # return HttpResponse(file)
        with open(file, 'r', encoding='utf-8') as pdfData:
            # response = HttpResponse(pdfData.read(), content_type='application/pdf')
            # response['Content-Disposition'] = 'inline;filename=' + docobj.filename + '.pdf'
            return response
        pdfData.closed
    except Documents.DoesNotExist:
        return HttpResponse(status.HTTP_404_NOT_FOUND)


@api_view(['POST', 'GET'])
@parser_classes((JSONParser,))
def SearchPendingMetaData(request, format=None):
    pagination_class = LargeResultsSetPagination
    current_user = request.user
    searchstring = request.data['search']
    try:
        dbfile = TempRepository.objects.filter(creator=current_user, name__startswith=searchstring)
        serializer = PendingMetaSerializer(dbfile, many=True)
        return Response(serializer.data)
    except TempRepository.DoesNotExist:
        return Response({'status': 'failed', 'message': 'File Not Found'}, status=404)


class SearchPendingMetaData(viewsets.ModelViewSet):
    serializer_class = PendingMetaSerializer
    pagination_class = LargeResultsSetPagination
    http_method_names = ['get']

    def get_queryset(self):
        current_user = self.request.user
        searchstring = self.request.query_params.get('search', None)
        if searchstring is not None:
            queryset = TempRepository.objects.filter(creator=current_user, name__startswith=searchstring)
        else:
            queryset = []
        return queryset


@api_view(['HEAD', 'GET', 'POST', 'DELETE', 'PUT'])
@parser_classes((JSONParser,))
def elasticTest(request):
    try:
        document = Documents.objects.all()
        for doc in document:
            data = {
                'id': doc.id,
                'tags': doc.tags,
                'metadata': doc.metadata,
                'uploader': doc.uploader.get_full_name(),
                'uploader_id': doc.uploader_id
            }
            Elastic.save(data)
            doc.published = True
            Elastic.update(doc)

        advanced = {
            "search_type": "advanced",
            "start": 0,
            "length": 10,
            "keyword": {
                "metas": {
                    "address": "130 15 Baganbari",
                    "name": "Mamun",
                    "nid": "32432lk32l4kj32kl"
                },
                "filename": "With expire Three",
                # "creation_date": "2017-03-05",
                # "expiry_date": "2017-04-30",
                "match": True,
                "archived": False,
                # "tags": ["test"],
                # "doc_type": 12
            }
        }
        standard = {
            "search_type": "standard",
            "keyword": "Mamun",
            "start": 0,
            "length": 5,
            "draw": 1
        }
        result = Elastic.search(standard)

        return Response(result, status=200)
    except Exception as ex:
        return Response(ex, status=404)


@api_view(['POST'])
def page_count(request):
    from_date = request.data.get('from')
    to_date = request.data.get('to')
    documents = Documents.objects.filter()

    if from_date and to_date:
        documents = documents.filter(creation_date__range=[from_date, to_date])

    documents = documents.values('doc_type__name').annotate(total=Sum('pages'))
    return Response({'data': documents})


@api_view(['POST'])
@parser_classes((JSONParser,))
def search(request):
    try:
        result = Elastic.search(request.data)
        return Response(result, status=200)
    except Exception as ex:
        return Response(ex, status=404)


@api_view(['POST'])
@parser_classes((JSONParser,))
def download_selected_files(request):
    selection_type = request.data.get('selection_type')
    doc_id_list = request.data.get('doc_id_list')
    search_params = request.data.get('search_params')
    exclude_list = request.data.get('exclude_list')
    search_total_loop = request.data.get('search_total_loop')
    user_id = request.user.id

    if selection_type:
        if not search_params:
            raise serializers.ValidationError({'detail': 'You have to send search keys using search_params parameter.'})

        if not search_total_loop:
            raise serializers.ValidationError({'detail': 'You have to send search_total_loop parameter.'})

        if not exclude_list:
            exclude_list = []

        DMSTasks.download_all_items.delay(user_id, exclude_list, search_params, search_total_loop)
    else:
        if not doc_id_list:
            raise serializers.ValidationError({'detail': 'You have to send array of id using doc_id_list parameter.'})

        DMSTasks.download_selected_items.delay(user_id, doc_id_list)

    return Response({'detail': 'A file will be generated. Please check in Requested download page.'})


class CheckOutSerializer(serializers.ModelSerializer):
    locker_name = serializers.ReadOnlyField(source='locked_by.get_full_name')
    doctype = serializers.ReadOnlyField(source='doc_type.name')

    class Meta:
        model = Documents
        fields = ['id', 'filename', 'creation_date', 'expiry_date', 'extension', 'locker_name', 'version', 'locked',
                  'doctype', 'locked_at']


class CheckOutViewSet(viewsets.ModelViewSet):
    pagination_class = LargeResultsSetPagination
    serializer_class = CheckOutSerializer
    http_method_names = ['get']

    def get_queryset(self):
        current_user = self.request.user
        if current_user.role_id == 1:
            queryset = Documents.objects.filter(locked=True, deleted=False, archived=False, published=True)
        else:
            queryset = Documents.objects.filter(locked=True, deleted=False, archived=False, locked_by=current_user,
                                                published=True)
        return queryset


class DocumentSummarySerializer(serializers.Serializer):
    label = serializers.CharField(max_length=255)
    value = serializers.IntegerField()
    # color = serializers.CharField(source='get_colors')
    #
    # @property
    # def get_colors(self):
    #     r = lambda: random.randint(0, 255)
    #     return '#%02X%02X%02X' % (r(), r(), r())


@api_view(['GET'])
@parser_classes((JSONParser,))
def DocumentSummaryViewSet(request):
    current_user = request.user
    if current_user.role_id == 1:
        returndata = Documents.objects.filter(deleted=False, published=True).values('doc_type').annotate(
            label=Concat('doc_type__name', Value('')), value=Count('doc_type'))
        serializer = DocumentSummarySerializer(returndata, many=True)
        return Response(serializer.data)
        # return Response(Documents.objects.filter(deleted=False, published=True).values('doc_type').annotate(label=Concat('doc_type__name', Value('')), value=Count('doc_type'), color = Value('#%02X%02X%02X' % (r(),r(),r()), CharField(15))))
        # return Response(Documents.objects.filter(deleted=False, published=True).values('doc_type').annotate(label=Concat('doc_type__name', Value('')), value=Count('doc_type')).extra(color = Value('#%02X%02X%02X' % (r(),r(),r()), CharField(15))))

    else:
        return Response(
            Documents.objects.filter(uploader=current_user, deleted=False, published=True).values(
                'doc_type').annotate(
                label=Concat('doc_type__name', Value('')), value=Count('doc_type')))


# upload serializer
class UploadDocumentSerialization(serializers.ModelSerializer):
    uploader = UserSerializer(many=False, read_only=True)
    doctype = serializers.SerializerMethodField('get_doc_type')

    # groupdoc = serializers.SerializerMethodField('get_grp_doc')
    #
    # def get_grp_doc(self, obj):
    #     grp = Documents.objects.values('doc_type_id').annotate(dcount=Count('doc_type_id'))
    #     return grp

    def get_doc_type(self, obj):
        docTypes = Category.objects.get(id=obj.doc_type_id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '->'.join([str(i) for i in docTypes])
        return docType

    class Meta:
        model = Documents
        fields = '__all__'


# return upload details
class UploadReportViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = UploadDocumentSerialization
    pagination_class = LargeResultsSetPagination
    model = Documents
    change_keys = {
        'doc_type': 'doc_type__name'
    }
    search_keywords = ['filename', 'uploader__first_name', 'uploader__last_name', 'doc_type__name', 'metadata']

    # permission_id = [21, ]

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        perm_list = self.request.user.role.permission.values_list('id', flat=True)
        user = self.request.query_params.get('user', None)
        if user is None:
            if self.request.user.role.id == 1:
                queryset = self.model.objects
            else:
                if 21 in perm_list:
                    queryset = self.model.objects
        else:
            queryset = self.model.objects.filter(uploader=user)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(uploaded_at__range=[date_from, date_to])

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()

        return queryset


# Document Summary

class DocumentSummarySerialization(serializers.ModelSerializer):
    class Meta:
        model = Documents
        fields = '__all__'


class DocSumReportViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = DocumentSummarySerialization
    pagination_class = LargeResultsSetPagination
    queryset = Documents.objects.all()
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        user = self.request.query_params.get('user', None)

        if user is None:
            if request.user.role.id == 1:
                result = Documents.objects.filter(archived=False, deleted=False, published=True,
                                                  parent__isnull=True, locked=False) \
                    .values('uploader').annotate(total=Count('uploader')) \
                    .values('uploader__username', 'total')
            else:
                result = Documents.objects.filter(uploader=request.user, archived=False, deleted=False,
                                                  published=True,
                                                  parent__isnull=True, locked=False) \
                    .values('uploader').annotate(total=Count('uploader')) \
                    .values('uploader__username', 'total')
        else:
            result = Documents.objects.filter(uploader=user, archived=False, deleted=False, published=True,
                                              parent__isnull=True, locked=False) \
                .values('uploader').annotate(total=Count('uploader')) \
                .values('uploader__username', 'total')

        data_list = []

        for v_dict in result:
            l_d = list()
            for k, v in sorted(v_dict.items(), reverse=True):
                l_d.append(v)
            data_list.append(l_d)
        return Response(data_list)


# Document type Summary
class DocumentTypeSummarySerialization(serializers.ModelSerializer):
    class Meta:
        model = Documents
        fields = '__all__'


class DocTypeReportViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = DocumentTypeSummarySerialization
    pagination_class = LargeResultsSetPagination
    queryset = Documents.objects.all()
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        user = self.request.query_params.get('user', None)

        if user is None:
            if request.user.role.id == 1:
                result = Documents.objects.filter(archived=False, deleted=False, published=True,
                                                  parent__isnull=True, locked=False).values('doc_type') \
                    .annotate(total=Count('doc_type')).values('doc_type__name', 'total')
            else:
                result = Documents.objects.filter(uploader=request.user, archived=False, deleted=False,
                                                  published=True,
                                                  parent__isnull=True, locked=False).values('doc_type') \
                    .annotate(total=Count('doc_type')).values('doc_type__name', 'total')

        else:
            result = Documents.objects.filter(uploader=user, archived=False, deleted=False, published=True,
                                              parent__isnull=True, locked=False).values('doc_type') \
                .annotate(total=Count('doc_type')).values('doc_type__name', 'total')
        data_list = []

        for v_dict in result:
            l_d = list()
            for k, v in sorted(v_dict.items(), reverse=False):
                l_d.append(v)
            data_list.append(l_d)
        return Response(data_list)


# Version preview
class VersionPreviewSerializer(serializers.ModelSerializer):
    get_version = serializers.SerializerMethodField('get_version')

    def get_version(self, obj):
        docTypes = Category.objects.get(id=obj.doc_type_id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '->'.join([str(i) for i in docTypes])
        return docType

    class Meta:
        model = Documents
        fields = '__all__'


class VersionPreviewViewset(viewsets.ModelViewSet):
    serializer_class = VersionPreviewSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Documents.objects.all()
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            parent_id = Documents.objects.filter(parent=docid)
            if parent_id:
                queryset = Documents.objects.filter(parent_id=docid).order_by('-version').first()
                filePath = queryset.filepath
                list = os.listdir('./' + 'media/' + filePath.replace('/tempfiles', '').replace('.xlsx', ''))
                files = []
                for l in list:
                    if l.endswith(".csv"):
                        files.append(l)
                number_files = len(files)
            else:
                queryset = Documents.objects.filter(id=docid).first()
                filePath = queryset.filepath
                list = os.listdir('./' + 'media/' + filePath.replace('/tempfiles', '').replace('.xlsx', ''))
                files = []
                for l in list:
                    if l.endswith(".csv"):
                        files.append(l)
                number_files = len(files)
            data = model_to_dict(queryset)
            data.update({'number_files': number_files})
        return Response(data)


class TempPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TempRepository
        fields = '__all__'


class TempPreviewViewSet(viewsets.ModelViewSet):
    serializer_class = TempPreviewSerializer
    pagination_class = LargeResultsSetPagination
    queryset = TempRepository.objects.all()
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            queryset = TempRepository.objects.filter(id=docid).first()
            encript_file_name = queryset.excel_file_path.split("/")[-1]
            file_path = 'tempfiles/' + str(encript_file_name).replace('.xlsx', '')
            file_list = os.listdir('./' + 'media/' + file_path.replace('.xlsx', ''))
            number_files = len(file_list)
            return HttpResponse(json.dumps({'file_path': file_path, 'number_files': number_files}))


# Restore archive
class ArchiveFileSerialization(serializers.ModelSerializer):
    class Meta:
        model = Documents
        fields = '__all__'


class RestoreArchiveViewSet(viewsets.ModelViewSet):
    serializer_class = ArchiveFileSerialization
    pagination_class = LargeResultsSetPagination
    queryset = Documents.objects.filter(archived=True)
    http_method_names = ['get', 'patch']

    @staticmethod
    def unarchived(instance):
        instance.archived = False
        instance.archived_by = None
        instance.archived_at = None
        instance.save()
        return instance

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance = RestoreArchiveViewSet.unarchived(instance)
        parent_file = instance.parent
        parent_id = parent_file.id if parent_file is not None else ''
        documents = Documents.objects.filter(archived=True, parent=parent_file)

        if parent_file:
            try:
                document = Documents.objects.get(pk=parent_file.id, archived=True)
                RestoreArchiveViewSet.unarchived(document)
            except Documents.DoesNotExist:
                pass

        if documents.count():
            for document in documents:
                RestoreArchiveViewSet.unarchived(document)

        Elastic.update(RestoreFileListViewSet.set_instance(instance), parent_id)
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        AuditTrail(self.request.user, instance, ip_address, "Restore Archive",
                   "restored from archive").add_audit()
        serializer = ArchiveFileSerialization(instance)
        return Response(serializer.data)


class DownloadSearchResultSerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()

    def get_path(self, obj):
        return 'media/{}'.format(obj.path)

    class Meta:
        model = DownloadSearchResult
        fields = '__all__'


class DownloadSearchResultViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = DownloadSearchResultSerializer
    pagination_class = LargeResultsSetPagination
    queryset = DownloadSearchResult.objects.filter().order_by('-created_at')
    http_method_names = ['get']
    model = DownloadSearchResult
    permission_id = [14]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class SaveSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaveSearch
        fields = '__all__'

    # def create(self, validated_data):
    #     search_name = validated_data.get('search_name')
    #     user = self.context['request'].user
    #     tags = json.dumps(request.data['meta_data']['tags'])
    #     metas = json.dumps(request.data['meta_data']['metas'])
    #     print(search_name)
    #     validated_data.update({'search_name': search_name})
    #     validated_data.update({'user': user})
    #     save_search = SaveSearch.objects.create(**validated_data)
    #     return save_search


class SaveSearchViewSet(viewsets.ModelViewSet):
    serializer_class = SaveSearchSerializer
    pagination_class = LargeResultsSetPagination
    queryset = SaveSearch.objects.all()
    model = SaveSearch

    def create(self, request, *args, **kwargs):
        search_list = SaveSearch.objects.filter(user=request.user)
        if search_list.count() >= 5:
            raise serializers.ValidationError({'detail': 'You can only add 5 items'})
        try:
            search_name = request.data['search_name']
            DocumentType = request.data['DocumentType']
            docName = request.data['docname']
            box_number = request.data['box_number']
            shelf_number = request.data['shelf_number']
            doccreated = request.data['doccreated']
            docexpired = request.data['docexpire']
            archived = request.data['archived']
            match = request.data['match']
            tags = json.dumps(request.data['tags'])
            metas = json.dumps(request.data['metadata'])
            search_data = {
                "search_name": search_name,
                "docName": docName,
                "user": request.user,
                "DocumentType": DocumentType,
                "doccreated": doccreated,
                "docexpired": docexpired,
                "metadata": metas,
                "box_number": box_number,
                "shelf_number": shelf_number,
                "tags": tags,
                "match": match,
                "archived": archived,
            }
            SaveSearch.objects.create(**search_data)
            return Response({'status': 'success', 'message': 'Search saved successfully'}, status=200)
        except Exception as ex:
            return Response({'status': 'failed', 'message': 'Sorry could not save search'}, status=422)

    def list(self, request, *args, **kwargs):
        user = self.request.user
        queryset = self.queryset.filter(user=user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class WaterMarkViewset(viewsets.ModelViewSet):
    serializer_class = ViewDocumentSerialization
    http_method_names = ['get']

    def get_queryset(self):
        docid = self.request.query_params.get('doc_id', None)
        value = self.request.query_params.get('value')
        free_text = self.request.query_params.get('free_text')
        watermark_value = 0
        queryset = None
        if docid:
            queryset = Documents.objects.filter(id=docid)
            document = queryset[0]
            if document.filepath.endswith('.pdf'):
                file_path = os.path.join(settings.BASE_DIR, 'media/') + document.filepath
                if value != 'reset':
                    if value != 'free_text':
                        watermark = WaterMarkFiles.objects.get(name=value)
                        file = watermark.file
                        watermark_value = watermark.value
                        watermark_path = os.path.join(settings.BASE_DIR, 'media/{}').format(file)
                        # size = portrait(A4)
                        c = canvas.Canvas(os.path.join(settings.BASE_DIR, 'media/repository/') + 'watermark.pdf')
                        # c.drawImage(watermark_path, 250, 350, 104, 124, 180, 100, )
                        c.drawImage(watermark_path, 0, 680, 104, 110, )
                        c.save()
                        watermark_pdf = os.path.join(settings.BASE_DIR, 'media/repository/watermark.pdf')
                        output_file = PdfFileWriter()
                        input_file = PdfFileReader(open(file_path, "rb"))
                        page_counts = input_file.getNumPages()
                        for page_number in range(page_counts):
                            watermark = PdfFileReader(open(watermark_pdf, "rb"))
                            # input_page = watermark.getPage(0)
                            # input_page.mergePage(input_file.getPage(page_number))
                            input_page = input_file.getPage(page_number)
                            # print(input_page.mediaBox)
                            input_page.mergePage(watermark.getPage(0))
                            output_file.addPage(input_page)
                        fname = file_path.replace('.pdf', '') + 'watermarked.pdf'
                        with open(fname, "wb") as outputStream:
                            output_file.write(outputStream)
                            outputStream.close()
                    elif value == 'free_text':
                        packet = io.BytesIO()
                        can = canvas.Canvas(packet, pagesize=letter)
                        can.setFillColorRGB(1, 0, 0)
                        can.setFont("Helvetica", 30)
                        can.drawString(250, 350, free_text)
                        can.save()
                        existing_pdf = PdfFileReader(open(file_path, "rb"))
                        output = PdfFileWriter()
                        page_counts = existing_pdf.getNumPages()
                        for page_number in range(page_counts):
                            packet.seek(0)
                            new_pdf = PdfFileReader(packet)
                            page = existing_pdf.getPage(page_number)
                            page.mergePage(new_pdf.getPage(0))
                            output.addPage(page)
                        fname = file_path.replace('.pdf', '') + 'watermarked.pdf'
                        with open(fname, "wb") as outputStream:
                            output.write(outputStream)
                            outputStream.close()
                        watermark_value = 5
                document.watermark = watermark_value
                document.watermark_file_path = document.filepath.replace('.pdf', '') + 'watermarked.pdf'
                document.watermarked_by = self.request.user
                document.watermarked_at = timezone.now()
                document.save()
                Elastic.update(document, document.parent_id)
            else:
                raise serializers.ValidationError({'detail': 'Only pdf documents will be applicable for watermark'})
        return queryset


class DocumentClassificationSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(source='uploader.get_full_name')
    classification = serializers.StringRelatedField(source='get_watermark_display')

    class Meta:
        model = Documents
        fields = ['user', 'filename', 'watermark', 'watermarked_by', 'watermarked_at', 'locked', 'locked_by',
                  'archived',
                  'archived_by', 'classification', 'creation_date']


@api_view(['GET'])
def doc_viewers(request, id):
    all_users = []
    permission_restriction = DocTypePermission.objects.filter(doc_id=id)
    for each_group in permission_restriction:
        group = each_group.groups
        for users in group.user.all():
            user_object = {
                'id': users.pk,
                'name': users.get_full_name()
            }
            all_users.append(user_object)
    print("users", all_users)
    return Response({
        'users': all_users
    }, status=status.HTTP_201_CREATED)


class DocumentClassificationViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentClassificationSerializer
    pagination_class = LargeResultsSetPagination
    model = Documents
    change_keys = {
    }
    search_keywords = ['uploader__username', 'filename', 'watermark']

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        user = self.request.user
        perm_list = self.request.user.role.permission.values_list('id', flat=True)
        classification = self.request.query_params.get('classification')
        queryset = self.model.objects
        if classification:
            queryset = queryset.filter(watermark=classification)
        if user.role.id == 1 or 21 in perm_list:
            queryset = queryset
        else:
            queryset = queryset.filter(uploader=user)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(uploaded_at__range=[date_from, date_to])

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()
        return queryset


class DocumentExpireSerializer(serializers.ModelSerializer):
    doctype = serializers.ReadOnlyField(source='doc_type.name')

    class Meta:
        model = Documents
        fields = '__all__'


class DocumentExpireViewSet(viewsets.ModelViewSet):
    pagination_class = LargeResultsSetPagination
    serializer_class = DocumentExpireSerializer
    http_method_names = ['get']
    change_keys = {
    }
    search_keywords = ['uploader__username', 'filename']

    def get_queryset(self):
        current_user = self.request.user
        date_from = date.today()
        date_to = date_from + timedelta(30)
        if current_user.role_id == 1:
            queryset = Documents.objects.filter(locked=False, deleted=False, archived=False, published=True,
                                                expiry_date__range=[date_from, date_to])
        else:
            queryset = Documents.objects.filter(locked=False, deleted=False, archived=False, uploader=current_user,
                                                published=True, expiry_date__range=[date_from, date_to])
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(login__range=[date_from, date_to])

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()
        return queryset
