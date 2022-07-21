from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from .views import *


router = DefaultRouter()
router.register('', AnnouncementViewSet, base_name='announcement')

urlpatterns = [
    url(r'^view/$', AnnouncementView.as_view(), name='view'),
    url(r'^', include(router.urls)),
]
