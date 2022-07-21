from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()
router.register('audit', LoginReportViewSet, base_name='audit')

urlpatterns = [
    url(r'^', include(router.urls)),
]
