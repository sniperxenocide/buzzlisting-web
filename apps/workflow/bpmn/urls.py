from django.conf.urls import url, include
from .views import *

urlpatterns = [
    url(r'^project_list/$', ProjectList.as_view(), name='project_list'),
    url(r'^draw_diagram/(?P<pk>[0-9]+)/$', ProjectView.as_view(), name='draw_diagram'),
    url(r'^eform/(?P<pk>[0-9]+)/$', EFormView.as_view(), name='eform'),
]
