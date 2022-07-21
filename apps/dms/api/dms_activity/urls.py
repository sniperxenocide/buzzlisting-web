from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()
router.register('dms_activity', DmsActivityViewSet, base_name='dms_activity')

urlpatterns = [
    url(r'^', include(router.urls)),
]
