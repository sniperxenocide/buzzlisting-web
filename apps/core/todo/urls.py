from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from .views import *


router = DefaultRouter()
router.register('', TodoViewSet, base_name='todo')

urlpatterns = [
    url(r'^', include(router.urls)),
]
