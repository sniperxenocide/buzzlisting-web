import xlrd
import csv
import hashlib
import collections
from django.contrib.auth.decorators import login_required
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.db.models.functions import Coalesce
from django.db.models.signals import post_save
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, request
from django.utils import six
from django.shortcuts import render, render_to_response, redirect
from django.template import RequestContext
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView, DetailView
from django.views.generic.base import View
from django.views.generic import ListView
from pip.utils import logging
from django.utils import timezone
import pytz
from datetime import datetime
import os
import pathlib
import errno
import glob
import shutil
from django.db.models import Q, Count
from apps.core.rbac.models import User
from apps.dms.api.category.models import DocTypePermission, MetaField
from django.urls import reverse
from django.views.generic.edit import FormView
from psycopg2.extensions import JSON
from rest_framework import serializers, viewsets
from rest_framework import permissions
from apps.core.rbac.models import Group
from apps.core.socket_chat.views import redis_pub_pending

import json
import subprocess

from apps.dms.api.dms_activity.models import DmsActivity
from django.utils import timezone

from rest_framework.pagination import PageNumberPagination

from apps.core.admin.views import admin_sidebar_menu

from apps.core.api.Pagination import LargeResultsSetPagination

from apps.dms.documents.models import TempRepository, Documents, Comments, LinkedFiles
from apps.workflow.bpmn.models import Application, AppComment, AppQuery

from conf import settings
from conf import licensed


@property
def document_sidebar(self):
    permission = 0
    if settings.DMS == '9dL53eBFDK':#and settings.USER_DMS == '1q2w3e':
        pending_count_g = TempRepository.objects.filter(creator=self.request.user).count()
        sidebar = [
            ['allowed', 'Explorer', reverse_lazy('dms:document:explorer'), 'zmdi-picture-in-picture', []],
            # ['not-allowed', 'Workspace', reverse_lazy('dms:document:workspace'), 'zmdi-storage', None],
        ]

        if self.request.user.role.id == 1:
            self.permission = 1
            sidebar.append(['allowed', 'Requested Downloads', reverse_lazy('dms:document:requested_downloads'),
                            'zmdi-hourglass-alt', []], )
            sidebar.append(
                ['allowed', 'Upload document', '#', 'zmdi-cloud-upload', [
                    ['allowed', 'Upload', reverse_lazy('dms:document:standard_upload'), 'zmdi-upload', []],
                    ['allowed', 'Pending Documents({})'.format(pending_count_g),
                     reverse_lazy('dms:document:pendingmetalist'),
                     'zmdi-cloud-done', []],
                ]],
            )
            sidebar.append(
                ['allowed', 'Check Out Document', reverse_lazy('dms:document:checkout'), 'zmdi-block', []],
            )
            # sidebar.append(
            #     ['allowed', 'Will be Expired Document', reverse_lazy('dms:document:expire'), 'zmdi-alarm', []],
            # )
            # sidebar.append(
            #     ['allowed', 'Create New Document', reverse_lazy('dms:document:create_new_document'),
            #      'zmdi-file-plus',
            #      None],
            # )

        else:
            perms_id = self.request.session['permission_list']
            if 14 in perms_id:
                sidebar.append(['allowed', 'Requested Downloads', reverse_lazy('dms:document:requested_downloads'),
                                'zmdi-hourglass-alt', []], )
                
            if 10 in perms_id:
                sidebar.append(
                    ['allowed', 'Upload document', '#', 'zmdi-cloud-upload', [
                        ['allowed', 'Upload', reverse_lazy('dms:document:standard_upload'), 'zmdi-upload', []],
                        ['allowed', 'Pending Documents({})'.format(pending_count_g),
                         reverse_lazy('dms:document:pendingmetalist'),
                         'zmdi-cloud-done', []],
                    ]],
                )
            if 13 in perms_id:
                sidebar.append(
                    ['allowed', 'Check Out Document', reverse_lazy('dms:document:checkout'), 'zmdi-block', []],
                )

                # if 9 in perms_id:
                #     sidebar.append(['allowed', 'Create New Document',
                # reverse_lazy('dms:document:create_new_document'),
                #                     'zmdi-file-plus', None], )
        sidebar.append(
            ['allowed', 'Will be Expired Document', reverse_lazy('dms:document:expire'), 'zmdi-alarm', []],
        )
    else:
        sidebar = []
    return sidebar


def MetaHistory(request, pk):
    #print("d", Documents.objects.get(pk=pk).doc_type_id)
    documents_array = Documents.objects.filter(parent_id=pk)
    pk_array = []
    pk_array.append(pk)
    for h in documents_array:
        #print("meta type", h.doc_type_id)
        pk_array.append(str(h.pk))
    history = DmsActivity.objects.filter(operation__in=['Edit Metadata', 'Attach Metadata', 'Create Metadata'],
                                         document_id__in=pk_array).order_by('-id')

    meta_key = []
    meta_key.append("Edition time")
    edited_value = []
    document_type = Documents.objects.get(pk=pk).doc_type_id
    Meta_Category = MetaField.objects.filter(doc_id=document_type).order_by('order')
    for c in Meta_Category:
        meta_key.append(c.title)
    #for h in history:
    #    metas = json.loads(h.metadata)
    #    for key in metas:
    #        if key not in meta_key:
    #            meta_key.append(key)
    for h in history:
        metas_element = collections.OrderedDict()
        for key in meta_key:
            metas_element[key] = ""
        hour = h.activity_time.hour
        pm_am = 'am'
        hour += 6
        if hour > 12:
            pm_am = 'pm'
            hour = hour-12
        metas_element['_EDITOR_'] = h.user.get_full_name()
        metas_element['Edition time'] = '{:%m/%d/%Y}'.format(h.activity_time)+'\n'\
                                    + str(hour)+":"+str(h.activity_time.minute)+" "+pm_am
        metas = json.loads(h.metadata)
        for key in metas:
            metas_element[key] = metas[key]
        edited_value.append(metas_element)
    return render(request, 'dms/document/viewHistory.html', {'history': edited_value, 'meta_title': meta_key})


@method_decorator(login_required, name='get')
class Upload(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/upload/upload.html'


@method_decorator(login_required, name='get')
class StandardUpload(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/upload/standardUpload.html'

    # def get(self, request, *args, **kwargs):
    #     # check upload permissions
    #     with transaction.atomic():
    #         if request.user.role.permission.filter(id=10).count():
    #             context = self.get_context_data(**kwargs)
    #             return self.render_to_response(context)
    #         else:
    #             return HttpResponseRedirect('/dashboard')


@method_decorator(login_required, name='post')
class FileSave(View):
    def post(self, request):

        try:
            current_user = request.user

            if request.FILES is None:
                logger = logging.getLogger(__name__)
                logger.warning("No files were attached to the upload.")
                return HttpResponseBadRequest('No file attached')
            else:
                files = [request.FILES.get('uploadfile')]
                for f in files:
                    print(f.content_type)
                    if f.content_type == 'application/msword':
                        try:
                            client_upload = TempRepository.objects.create(
                                document=f,
                                name=f.name,
                                extension=f.content_type,
                                creator=current_user
                            )
                            filepath = os.path.join(settings.BASE_DIR,
                                                    'media/tempfiles') + "/" + str(client_upload.document).replace(
                                'tempfiles/',
                                '')
                            p = subprocess.Popen(
                                ['libreoffice', '--headless', '--convert-to', 'pdf', filepath, '--outdir',
                                 os.path.join(settings.BASE_DIR, 'media/tempfiles')])

                        except Exception as ex:
                            print(ex)
                    elif f.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        try:
                            client_upload = TempRepository.objects.create(
                                document=f,
                                name=f.name,
                                extension=f.content_type,
                                creator=current_user
                            )
                            filepath = os.path.join(settings.BASE_DIR, 'media/tempfiles') + "/" + str(
                                client_upload.document).replace(
                                'tempfiles/',
                                '')

                            p = subprocess.Popen(
                                ['libreoffice', '--headless', '--convert-to', 'pdf', filepath, '--outdir',
                                 os.path.join(settings.BASE_DIR, 'media/tempfiles')])
                            print(p)
                        except Exception as ex:
                            print(ex)
                    elif f.content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' \
                            or f.content_type == 'application/vnd.ms-excel':
                        try:
                            today = datetime.now(pytz.timezone('Asia/Dhaka')).strftime('%Y-%m-%d%T')
                            client_upload = TempRepository.objects.create(
                                document=f,
                                name=f.name,
                                extension=f.content_type,
                                creator=current_user
                            )
                            fp = str(client_upload.document).replace("tempfiles/", '')
                            encript = hashlib.md5(
                                (fp + timezone.now().strftime('%Y-%m-%d-%s')).encode("utf")).hexdigest()
                            filepath = os.path.join(settings.BASE_DIR, 'media/tempfiles') + "/" + fp

                            # n_file_name = client_upload.name.replace(' ', '_')
                            newfolder = os.path.join(settings.MEDIA_ROOT,
                                                     'tempfiles') + "/" + encript + "/"
                            print(newfolder)

                            try:
                                if not os.path.exists(os.path.dirname(newfolder)):
                                    os.makedirs(os.path.dirname(newfolder))
                            except OSError as err:
                                print(err)

                            workbook = xlrd.open_workbook(filepath)
                            all_worksheets = workbook.sheet_names()
                            count = 0
                            for worksheet_name in all_worksheets:
                                worksheet = workbook.sheet_by_name(worksheet_name)
                                if worksheet.nrows > 0:
                                    count = count + 1
                                    with open('{}.csv'.format(encript + "_x_p_c" + str(count)), "w",
                                              newline="") as your_csv_file:
                                        wr = csv.writer(your_csv_file, dialect='excel')

                                        for rownum in range(worksheet.nrows):
                                            wr.writerow(worksheet.row_values(rownum))
                                        shutil.move('{}.csv'.format(encript + "_x_p_c" + str(count)),
                                                    os.path.join(settings.BASE_DIR,
                                                                 'media/tempfiles') + "/" + encript)
                                        # wr.writerow(
                                        #     [str(entry).encode("utf-8") for entry in worksheet.row_values(rownum)])
                                        # client_upload.excel_file_path = os.path.join(settings.BASE_DIR,
                                        #                                              'media/tempfiles') + "/" + "--" + today + fp

                            TempRepository.objects.filter(id=client_upload.id).update(
                                excel_file_path=os.path.join(settings.BASE_DIR,
                                                             'media/tempfiles') + "/" + encript + ".xlsx")
                        except Exception as ex:
                            print(ex)

                    else:
                        client_upload = TempRepository.objects.create(
                            document=f,
                            name=f.name,
                            extension=f.content_type,
                            creator=current_user
                        )
                    # Dms Activity Report
                    user_id = request.user.id
                    file_name = f.name
                    operation = "Upload"
                    activity_time = timezone.now()
                    description = "File: '" + file_name + "' has been Uploaded without Metadata "
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(',')[-1].strip()
                    else:
                        ip_address = request.META.get('REMOTE_ADDR')
                    count = TempRepository.objects.filter(creator=request.user).count()
                    redis_pub_pending(count)
                    DmsActivity(user_id=user_id, operation=operation, ip=ip_address, description=description,
                                activity_time=activity_time).save()
                # return HttpResponseRedirect('pendingMeta')
                # return HttpResponseRedirect('pendingmetalist')

                return HttpResponse(json.dumps({'doc_id': client_upload.id}))
        except:
            pass


class SmallPagesPagination(PageNumberPagination):
    page_size = 3


class PendingMetaListView(ListView):
    model = TempRepository
    paginate_by = '4'
    # queryset = TempRepository.objects.all()
    # context_object_name = "pendingMetaList"
    client = licensed.CLIENT_NAME
    template_name = 'dms/upload/addMeta.html'
    sidebar_menu = document_sidebar

    # def get(self, request, *args, **kwargs):
    #     # check upload permissions
    #     with transaction.atomic():
    #         if request.user.role.permission.filter(id=10).count():
    #             context = self.get_context_data(**kwargs)
    #             return self.render_to_response(context)
    #         else:
    #             return HttpResponseRedirect('/dashboard')


class ApplicationDetailView(DetailView):
    model = Application
    paginate_by = '4'
    client = licensed.CLIENT_NAME
    template_name = 'dms/upload/workflow_upload.html'
    sidebar_menu = document_sidebar


@method_decorator(login_required, name='get')
class PendingMeta(Upload):
    template_name = 'dms/upload/pendingMeta.html'


class PendingMetaSerializer(serializers.ModelSerializer):
    assigned_user_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = TempRepository
        fields = '__all__'


class PendingMetaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.DjangoModelPermissions]
    serializer_class = PendingMetaSerializer
    pagination_class = LargeResultsSetPagination

    def get_queryset(self):
        queryset = TempRepository.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
            queryset = queryset.order_by(order_dir + column_name)

            # search
            # if search and search is not None:
            #    queryset = tempRepository.objects.filter(
            #       Q(name__icontains=search) | Q(assigned_user__username__icontains=search) ).order_by('-updated_at')

        return queryset


@method_decorator(login_required, name='post')
class DeletePendingMetaFile(View):
    def post(self, request):
        current_user = request.user

        json_data = json.loads(request.body.decode('utf-8'))
        for obj in json_data:
            did = obj.get('id')
            dobj = TempRepository.objects.filter(id=did)
            dobj.delete()
        # raise
        return HttpResponse("200")
        # return redirect('pendingMeta')


class CategorizationView(TemplateView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'dms/categorization/all_doc_type.html'

    def get(self, request, *args, **kwargs):
        # check categorization permissions
        with transaction.atomic():
            if request.user.role.permission.filter(id=8).count():
                context = self.get_context_data(**kwargs)
                return self.render_to_response(context)
            else:
                return HttpResponseRedirect('/dashboard')


class PdfView(TemplateView):
    template_name = 'core/base/pdfview.html'


class WorkSpace(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/workspace/workspace.html'


@method_decorator(login_required, name='get')
class DocumentView(DetailView):
    sidebar_menu = document_sidebar
    model = Documents
    template_name = 'dms/document/view.html'

    def get(self, request, *args, **kwargs):
        # check permissions
        parent_id = Documents.objects.filter(parent=kwargs.get('pk'))
        if parent_id:
            file = Documents.objects.filter(parent_id=kwargs.get('pk')).order_by('-version').first()
        else:
            file = Documents.objects.filter(id=kwargs.get('pk')).first()
        # if file.parent_id is None:
        #     file = Documents.objects.filter(parent_id=kwargs.get('pk'))
        if file.extension == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            list = os.listdir('./' + 'media/' + file.filepath.replace('/tempfiles', '').replace('.xlsx', ''))
            files = []
            for l in list:
                if l.endswith(".csv"):
                    files.append(l)
            number_files = len(files)
        else:
            list = ''
            number_files = ''

        if request.user.role.permission.filter(id=11).count():
            if self.get_object().uploader.id == request.user.id:
                self.object = self.get_object()
                context = self.get_context_data(object=self.object)
                context['number_files'] = number_files
                context['file_list'] = list
                return self.render_to_response(context)

            if request.user.role.id == 1:
                self.object = self.get_object()
                context = self.get_context_data(object=self.object)
                context['number_files'] = number_files
                context['file_list'] = list
                return self.render_to_response(context)

            if self.get_object().doc_type.document_permission.filter(groups__user=request.user).count():
                self.object = self.get_object()
                context = self.get_context_data(object=self.object)
                context['number_files'] = number_files
                context['file_list'] = list
                return self.render_to_response(context)
            else:
                return HttpResponseRedirect('/dashboard')
        else:
            return HttpResponseRedirect('/dashboard')

    def get_context_data(self, **kwargs):
        context = super(DocumentView, self).get_context_data(**kwargs)
        docid = self.kwargs.get('pk')
        uid = self.request.user.id
        grps = Group.objects.filter(user=uid)
        parent_id = Documents.objects.filter(parent=docid)
        if parent_id:
            latestfile = Documents.objects.filter(parent_id=docid).order_by('-version').first()
        else:
            latestfile = Documents.objects.filter(id=docid).first()
        file = Documents.objects.get(id=docid)
        # relatedfiles = Documents.objects.filter(
        #     Q(filename=file.filename, parent__isnull=True) |
        #     Q(doc_type__document_permission__groups_id__in=grps)).exclude(id=docid)
        context['archive'] = latestfile
        context['comments'] = Comments.objects.filter(document_id=docid)
        context['versions'] = Documents.objects.filter(parent_id=docid).order_by('-version')
        context['latest_version'] = Documents.objects.filter(id=docid)
        context['latestfile'] = latestfile
        context['parent'] = Documents.objects.filter(id=docid).first()
        # context['linkedfiles'] = Documents.objects.filter(linkedfile__sourcefile=docid)
        context['linkedfiles'] = LinkedFiles.objects.filter(sourcefile_id=docid).prefetch_related('linkfile')
        if file.app_id is not None:
            context['app_number'] = Application.objects.get(id=file.app_id).number
            # context['app_number'] = Application.objects.get(id=file.app_id).
            context['comment_count'] = AppComment.objects.filter(application=file.app_id).count()
            context['query_count'] = AppQuery.objects.filter(application=file.app_id).count()
        return context


# class ArchiveView(DetailView):
#     sidebar_menu = document_sidebar
#     model = Documents
#     template_name = 'dms/document/archive_view.html'
#     queryset = Documents.objects.filter(archived=True)
#
#     # def get(self, request, *args, **kwargs):
#     #     docid = kwargs['pk']
#     #     print(docid)
#     #     # docid = self.request.query_params.get('doc_id', None)
#     #     parent_id = Documents.objects.filter(parent=docid, archived=True)
#     #     if parent_id:
#     #         # latestfile = Documents.objects.filter(Q(id=docid) | Q(parent=docid)).order_by(
#     #         #     Coalesce('version', 'parent').desc())
#     #         # print(latestfile.id)
#     #         latestfile = Documents.objects.filter(parent_id=docid, archived=True).order_by('-version').first()
#     #         print(latestfile)
#     #     else:
#     #         latestfile = Documents.objects.filter(parent_id=docid, archived=True).order_by('-version').first()
#     #     self.object = self.get_object()
#     #     context = self.get_context_data(object=self.object)
#     #     return self.render_to_response(context)
#     def get_context_data(self, **kwargs):
#         # Call the base implementation first to get a context
#         context = super(ArchiveView, self).get_context_data(**kwargs)
#         # Add in a QuerySet of all the books
#         docid = self.kwargs.get('pk')
#         parent_id = Documents.objects.filter(parent=docid, archived=True)
#         if parent_id:
#             latestfile = Documents.objects.filter(parent_id=docid, archived=True).order_by('-version').first()
#         else:
#             latestfile = Documents.objects.filter(id=docid, archived=True).first()
#         context['archive'] = latestfile
#         context['comments'] = Comments.objects.filter(document_id=docid)
#         context['versions'] = Documents.objects.filter(parent_id=docid, archived=True).order_by('-version')
#         context['parent'] = Documents.objects.filter(id=docid, archived=True).first()
#         # context['linkedfiles'] = LinkedFiles.objects.filter(sourcefile=docid)
#         context['linkedfiles'] = Documents.objects.filter(linkedfile__sourcefile=docid)
#         return context


class FileView(TemplateView):
    template_name = 'dms/document/fileview.html'


@method_decorator(login_required, name='get')
class Explorer(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/explorer/explorer.html'


@method_decorator(login_required, name='get')
class CheckOut(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/checkOut/checkout.html'


@method_decorator(login_required, name='get')
class Expire(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/expire/expire.html'


@method_decorator(login_required, name='get')
class RequestedDownloads(TemplateView):
    sidebar_menu = document_sidebar
    template_name = 'dms/explorer/requested_downloads.html'
