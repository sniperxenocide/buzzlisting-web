from django.conf.urls import url, include
from .views import *


urlpatterns = [
    url(r'^residential/$', ResidentialView.as_view(), name='residential'),
    url(r'^condo/$', CondoView.as_view(), name='condo'),
    url(r'^commercial/$', CommercialView.as_view(), name='commercial'),
    # url(r'^keyword/$', KeywordView.as_view(), name='keyword'),
    # url(r'^news/$', NewsView.as_view(), name='news'),

]
