from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from apps.workflow.email.views import *

router = DefaultRouter()

# emailLog api

router.register('email', EmailLogViewSet, base_name='email')

urlpatterns = [
    url(r'^', include(router.urls)),
]
