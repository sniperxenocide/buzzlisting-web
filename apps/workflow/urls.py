from django.conf.urls import url, include

urlpatterns = [
    url(r'^case/', include('apps.workflow.case.urls', 'case')),
    url(r'^workflow_report/', include('apps.workflow.report.urls', 'workflow_report')),
    url(r'^wf_email_log/', include('apps.workflow.email.urls', 'wf_email_log')),
    url(r'^script/', include('apps.workflow.script.urls','script'))
]
