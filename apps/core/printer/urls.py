from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter
from .views import *


urlpatterns = [
    # url(r'^$', PrinterView.as_view(), name='view'),
    url(r'^app_view/(?P<pk>[0-9]+)/$', PrinterView.as_view(), name='app_view'),
]