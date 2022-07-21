from django.conf.urls import url, include
from django.shortcuts import redirect

from conf import settings



def go_to(self):
    return redirect(settings.LOGIN_URL)


urlpatterns = [
    url(r'^$', go_to),
    url(r'^login/', include('apps.core.auth.urls', 'auth')),
    url(r'^dashboard/', include('apps.core.dashboard.urls', 'dashboard')),
    url(r'^admin/', include('apps.core.admin.urls', 'admin')),
    url(r'^buzzlisting/', include('apps.core.buzzlisting.urls', 'buzzlisting')),
    url(r'^api/', include('apps.core.api.urls', 'api')),
    url(r'^oauth2_provider/', include('oauth2_provider.urls', 'oauth2_provider')),
    url(r'^report/', include('apps.core.report.urls', 'report')),
    url(r'^search/', include('apps.core.search.urls', 'search')),
    url(r'^socket/', include('apps.core.socket_chat.urls', 'socket')),
    url(r'^printer/', include('apps.core.printer.urls', 'printer')),
    url('', include('social_django.urls', namespace='social')),
    url(r'^docs/', include('rest_framework_docs.urls', 'docs')),
 ]

if settings.DMS == '9dL53eBFDK':# and settings.USER_DMS == '1q2w3e':
    urlpatterns += [
        url(r'^dms/', include('apps.dms.urls', 'dms')),
    ]
if settings.WORKFLOW == 'aBX3RODumf':# and settings.USER_WORKFLOW == '1q2w3e':
    urlpatterns += [
        url(r'^workflow/', include('apps.workflow.urls', 'workflow')),
    ]
