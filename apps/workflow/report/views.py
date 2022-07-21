from django.urls import reverse_lazy

from django.views.generic import TemplateView

from apps.core.report.views import LoginReportView
from conf import settings


class KpiView(LoginReportView):
    template_name = 'workflow/report/kpi_report.html'


class WfEmailView(KpiView):
    template_name = 'workflow/cases/wf_email.html'


class WfActivityView(KpiView):
    template_name = 'workflow/report/wf_activity.html'


class WfActivityStatusView(KpiView):
    template_name = 'workflow/report/wf_activity_status.html'
