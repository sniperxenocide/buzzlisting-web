from django.conf.urls import url, include
from .views import *


urlpatterns = [
    url(r'^dms_activity/$', DmsActivityView.as_view(), name='dms_activity'),
    url(r'^document_summary/$', DocumentSummaryView.as_view(), name='document_summary'),
    url(r'^upload_report/$', UploadReportView.as_view(), name='upload_report'),
    url(r'^page_counts/$', PageCount.as_view(), name='page_count'),
    url(r'^document_classification/$', DocumentClassification.as_view(), name='document_classification'),
]
