from django.conf.urls import url, include

urlpatterns = [
    url(r'^document/', include('apps.dms.documents.urls', 'document')),
    url(r'^dms_report/', include('apps.dms.report.urls', 'dms_report')),
    url(r'^restore/', include('apps.dms.restore.urls', 'dms_restore')),
]
