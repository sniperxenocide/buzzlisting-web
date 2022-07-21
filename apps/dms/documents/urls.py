from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('pendingMetalist', PendingMetaViewSet,
                base_name='pendingMetalist')

urlpatterns = [
    url(r'^upload/standard_upload/$',
        StandardUpload.as_view(), name='standard_upload'),
    url(r'^upload/batch_upload/$', Upload.as_view(), name='batch_upload'),
    url(r'^create_new_document/$', Upload.as_view(), name='create_new_document'),
    url(r'^output_document/$', Upload.as_view(), name='output_document'),
    # url(r'^upload/standard_upload/filesave/pendingMeta/$', PendingMeta.as_view(), name='pendingMeta'),

    url(r'^upload/standard_upload/filesave/$',
        FileSave.as_view(), name='filesave'),
    url(r'^upload/standard_upload/filesave/pendingmetalist/$',
        PendingMetaListView.as_view(), name='pendingmetalist'),
    url(r'^upload/standard_upload/filesave/application/(?P<pk>[0-9]+)/$',
        ApplicationDetailView.as_view(), name='pendingmetalist'),

    url(r'^upload/standard_upload/deletePendingMeta/$',
        DeletePendingMetaFile.as_view(), name='deletePendingMeta'),

    url(r'^upload/standard_upload/', include(router.urls)),
    url(r'^root$', CategorizationView.as_view(), name='list'),
    url(r'^pdf_view/$', PdfView.as_view(), name='pdf_view'),
    url(r'^workspace/$', WorkSpace.as_view(), name='workspace'),
    url(r'^view/(?P<pk>[0-9]+)/$', DocumentView.as_view(), name='view'),
    url(r'^meta_history/(?P<pk>[0-9]+)/$', MetaHistory, name='meta_history'),
    # url(r'^view/archive/(?P<pk>[0-9]+)/$', ArchiveView.as_view(), name='archive_view'),
    url(r'^file/view/$', FileView.as_view(), name='file_view'),
    url(r'^explorer/$', Explorer.as_view(), name='explorer'),
    url(r'^checkout/$', CheckOut.as_view(), name='checkout'),
    url(r'^expire/$', Expire.as_view(), name='expire'),
    url(r'^requested_downloads/$', RequestedDownloads.as_view(), name='requested_downloads'),
]
