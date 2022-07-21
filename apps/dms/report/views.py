from django.urls import reverse_lazy

from django.views.generic import TemplateView

from apps.core.report.views import LoginReportView
from conf import settings


class DocumentSummaryView(LoginReportView):
    template_name = 'dms/report/document_summary.html'


class UploadReportView(DocumentSummaryView):
    template_name = 'dms/report/upload_report.html'


class DmsActivityView(DocumentSummaryView):
    template_name = 'dms/report/dms_activity.html'


class PageCount(DocumentSummaryView):
    template_name = 'dms/report/page_count.html'


class DocumentClassification(DocumentSummaryView):
    template_name = 'dms/report/document_classification.html'
