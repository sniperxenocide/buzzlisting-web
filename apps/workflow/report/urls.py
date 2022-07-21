from django.conf.urls import url, include
from .views import *


urlpatterns = [
    url(r'^kpi/$', KpiView.as_view(), name='kpi'),
    url(r'^wf_email$', WfEmailView.as_view(), name='wf_email'),
    url(r'^wf_activity$', WfActivityView.as_view(), name='wf_activity'),
    url(r'^wf_activity_status$', WfActivityStatusView.as_view(), name='wf_activity_status'),
]
