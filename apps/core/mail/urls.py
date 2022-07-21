from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter
from .views import *


urlpatterns = [
    url(r'^$', MailView.as_view(), name='view'),
    url(r'^test_mail/', get_mail, name='test_mail'),
]
