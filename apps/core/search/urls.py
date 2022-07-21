from django.conf.urls import url, include
from .views import *


urlpatterns = [
    url(r'$', SearchResultView.as_view(), name='search_result'),
]