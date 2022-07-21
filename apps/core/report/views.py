from django.urls import reverse_lazy

from django.views.generic import TemplateView

from conf import settings


def report_sidebar(self):
    sidebar = []
    permission = 0
    permissions = self.request.session['permission_list']

    login_report = {
        'allowed': ['allowed', 'Sys Admin Login Report', reverse_lazy('report:login_report'), 'zmdi-account-box', []],
        'not-allowed': ['not-allowed', 'Login Report', '#', 'zmdi-account-box', []],
    }

    resolved_report = {
        'allowed': ['allowed', 'Resolved Report', reverse_lazy('report:resolved_report'), 'zmdi-account-box', []],
        'not-allowed': ['not-allowed', 'Resolved Report', '#', 'zmdi-account-box', []],
    }

    dms_report = {
        'allowed': ['allowed', 'DMS', '#', 'zmdi zmdi-file-text', [
            ['allowed', 'Activity', reverse_lazy('dms:dms_report:dms_activity'), 'zmdi zmdi-local-activity', []],
            ['allowed', 'Document Summary', reverse_lazy('dms:dms_report:document_summary'), 'zmdi zmdi-fullscreen',
             []],
            ['allowed', 'Upload Record', reverse_lazy('dms:dms_report:upload_report'), 'zmdi zmdi-upload',
             []],
            ['allowed', 'Document Classification', reverse_lazy('dms:dms_report:document_classification'),
             'zmdi zmdi-menu',
             []],
            ['allowed', 'Page Count', reverse_lazy('dms:dms_report:page_count'), 'zmdi zmdi-upload',
             []],
        ], ],
        'not-allowed': ['not-allowed', 'DMS', '#', 'zmdi zmdi-file-text', [
            ['not-allowed', 'Activity', '#', 'zmdi zmdi-local-activity', []],
            ['not-allowed', 'Document Summary', '#', 'zmdi zmdi-fullscreen', []],
            ['not-allowed', 'Upload Record', '#', 'zmdi zmdi-upload', []],
            ['not-allowed', 'Document Classification', '#', 'zmdi zmdi-menu', []],
            ['not-allowed', 'Page count', '#', 'zmdi zmdi-upload', []],
        ], ],
    }

    workflow_report = {
        'allowed': ['allowed', 'Workflow', '#', 'zmdi zmdi-rotate-cw', [
            ['allowed', 'KPI Report', reverse_lazy('workflow:workflow_report:kpi'), 'zmdi zmdi-trending-up',
             []],
            ['allowed', 'Workflow Email', reverse_lazy('workflow:workflow_report:wf_email'),
             'zmdi-email-open', []],
            ['allowed', 'Workflow Activity', reverse_lazy('workflow:workflow_report:wf_activity'),
             'zmdi zmdi-directions-run', []],
        ], ],
        'not-allowed': ['not-allowed', 'Workflow', '#', 'zmdi zmdi-rotate-cw', [
            ['not-allowed', 'KPI Report', '#', 'zmdi zmdi-trending-up', []],
            ['not-allowed', 'Workflow Email', '#', 'zmdi-email-open', []],
            ['not-allowed', 'Workflow Activity', '#', 'zmdi zmdi-directions-run', []],
        ], ],
    }

    if self.request.user.role.id == 1:
        permission = 1
        sidebar.append(login_report['allowed'])
        sidebar.append(resolved_report['allowed'])

        if settings.DMS == "9dL53eBFDK":# and settings.USER_DMS == '1q2w3e':
            sidebar.append(dms_report['allowed'])

        if settings.WORKFLOW == "aBX3RODumf":# and settings.USER_WORKFLOW == '1q2w3e':
            sidebar.append(workflow_report['allowed'])
    else:
        if 21 in permissions:
            permission = 1
            sidebar.append(login_report['allowed'])
        else:
            sidebar.append(login_report['not-allowed'])

        if settings.DMS == '9dL53eBFDK':# and settings.USER_DMS =='1q2w3e':
            permission = 0
            sidebar.append(dms_report['allowed'])
        else:
            sidebar.append(dms_report['not-allowed'])

        if settings.WORKFLOW == "aBX3RODumf":# and settings.USER_WORKFLOW =='1q2w3e':
            if 3 in permissions:
                permission = 0
                sidebar.append(workflow_report['allowed'])
            else:
                sidebar.append(workflow_report['not-allowed'])

    return {
        'sidebar': sidebar,
        'permission': permission,
    }


class LoginReportView(TemplateView):
    template_name = 'core/report/login_report.html'
    sidebar_menu = None
    permission = 0

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        r = report_sidebar(self)
        self.sidebar_menu = r.get('sidebar')
        self.permission = r.get('permission')
        return self.render_to_response(context)


class ResolvedContactRequestList(TemplateView):
    template_name = 'core/report/resolved.html'
    sidebar_menu = None
    permission = 0

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        r = report_sidebar(self)
        self.sidebar_menu = r.get('sidebar')
        self.permission = r.get('permission')
        return self.render_to_response(context)
