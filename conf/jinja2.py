from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import reverse
from conf.settings import STATIC_URL, MEDIA_URL, DMS, WORKFLOW, SOCKET_LISTENING_PORT #USER_DMS, USER_WORKFLOW
from apps.core.admin.views import get_ip_address

from jinja2 import Environment


def environment(**options):
    env = Environment(**options)
    env.globals.update({
        'static': staticfiles_storage.url,
        'url': reverse,
        'STATIC_URL': STATIC_URL,
        'MEDIA_URL': MEDIA_URL,
        'BASE_TEMPLATE': 'core/base/base.html',
        'DMS': DMS,
        'WORKFLOW': WORKFLOW,
        #'USER_DMS': USER_DMS,
        #'USER_WORKFLOW': USER_WORKFLOW,
        'SOCKET_LISTENING_PORT': SOCKET_LISTENING_PORT,
        'IP_ADDRESS': get_ip_address
    })
    return env
