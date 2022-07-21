from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("delpendingmeta", views.PendingMetaViewSet, 'delpendingmeta')
router.register("deletedocument", views.ViewDocumentViewSet, 'deletedocument')
router.register("comments", views.CommentViewSet, 'comments')
router.register("viewdocument", views.ViewDocumentViewSet, 'viewdocument')
router.register("linkeddocument", views.LinkedDocumentViewSet, 'linkeddocument')
router.register("pendingMetaList", views.PendingMetaViewSet, 'pendingMetaList')
router.register("truependingMetaList", views.TruePendingMetaViewSet, 'truependingMetaList')

router.register("documentlist", views.DocumentListViewSet, 'documentlist')
router.register('versions', views.Versions, base_name='versions')
router.register('related', views.ViewUserDocumentViewSet, base_name='related')
router.register('restoreFileList', views.RestoreFileListViewSet, 'restoreFileList')
router.register('searchpendingmeta', views.SearchPendingMetaData, 'searchpendingmeta')
router.register('update/metadata', views.ViewDocumentViewSet, base_name='updatemetadata')
router.register('delete_all_pendings', views.DeleteAllPendingMetaViewSet, base_name='deleteAllPendingDoc')
router.register('checkoutdoc', views.CheckOutViewSet, base_name='checkoutdoc')
router.register('will_be_expired_doc', views.DocumentExpireViewSet, base_name='will_be_expired_doc')
router.register('uploadreport', views.UploadReportViewSet, base_name='uploadreport')
router.register('docsum', views.DocSumReportViewSet, base_name='docsum')
router.register('doctypesum', views.DocTypeReportViewSet, base_name='doctypesum')
router.register('restoreFile', views.RestoreFileListViewSet, base_name='restoreFile')
router.register('operation', views.ViewDocumentViewSet, base_name='operation')
router.register('attach_metadata', views.MetadataAttachmentViewSet, base_name='attach_metadata')
router.register('attach_watermark', views.WaterMarkViewset, base_name='attach_watermark')
router.register('download_search_result', views.DownloadSearchResultViewSet, base_name='download_search_result')
router.register('version_preview', views.VersionPreviewViewset, base_name='version_preview')
router.register('temp_preview', views.TempPreviewViewSet, base_name='temp_preview')
router.register('sync_data_to_search_engine', views.SyncDataWithSearchEngineViewSet,
                base_name='sync_data_to_search_engine')
router.register('count_dms', views.CountViewSetDMS, base_name='count')  # azmi
router.register('save_search', views.SaveSearchViewSet, base_name='save_search')
router.register('document_classification', views.DocumentClassificationViewSet, base_name='document_classification')

urlpatterns = [
    url(r'^document_viewers/(?P<id>[0-9]+)$', views.doc_viewers),
    url(r'^redacted_user/(?P<id>[0-9]+)$', views.AttachRedactedUser),
    url(r'^save_annotation_redaction/(?P<id>[0-9]+)/(?P<type>[a-z]+)$', views.AttachAnnotationRedaction),
    url(r'^filepreview/(?P<id>[0-9]+)$', views.fileview),
    url(r'^documentpreview/(?P<id>[0-9]+)$', views.documentPreView),
    url(r'^attachmeta/$', views.AttachMetaData),
    # url(r'^searchpendingmeta/$', views.SearchPendingMetaData),
    url(r'^exploerer/$', views.SearchPendingMetaData),
    url(r'^requested_downloads/$', views.SearchPendingMetaData),

    url(r'^generatethumbnail/$', views.generateThumbnail.as_view(), name='generatethumbnail'),
    url(r'^read/(?P<id>[0-9]+)/$', views.read, name='read'),
    url(r'^elasticsearch/$', views.elasticTest, name='elasticsearch'),
    url(r'^search/$', views.search, name='search'),
    url(r'^download_selected_files/$', views.download_selected_files, name='download_selected_files'),
    url(r'^page_count/$', views.page_count, name='page_count'),
    url(r'^documentsummary/$', views.DocumentSummaryViewSet, name='documentsummary'),
    #url(r'^meta_history/(?P<id>[0-9]+)/$', views.LinkedDocumentViewSet),
    url(r'^', include(router.urls))
]