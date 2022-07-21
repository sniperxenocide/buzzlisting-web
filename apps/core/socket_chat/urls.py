
from django.conf.urls import include, url
from rest_framework.routers import DefaultRouter

from .socket_api import *

router = DefaultRouter()
router.register('notification', CommentsViewSet, base_name='notification')
router.register('status', StatusesViewSet, base_name='status')

urlpatterns = [

               url(r'^', include(router.urls)),

]