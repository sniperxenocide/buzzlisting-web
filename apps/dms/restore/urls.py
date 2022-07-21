from django.conf.urls import url, include
from .views import *

urlpatterns = [
    # url(r'^dms_activity/$', DmsActivityView.as_view(), name='dms_activity'),
    url(r'', RestoreData.as_view(), name='restore'),
]