from django.conf.urls import url, include
from .views import *


urlpatterns = [
    url(r'^login_report/$', LoginReportView.as_view(), name='login_report'),
    url(r'^resolved_report/$', ResolvedContactRequestList.as_view(), name='resolved_report'),

]
