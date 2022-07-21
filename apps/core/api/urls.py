from django.conf.urls import url, include
from apps.core.auth.views import login_user, ChangePasswordView
from conf import settings

urlpatterns = [
    url(r'^v1/auth/login/$', login_user, name='login'),
    url(r'^v1/', include('apps.core.rbac.urls', 'rbac')),
    url(r'^v1/login_report/', include('apps.core.loginReport.urls', 'login_report')),
    url(r'v1/announcement/', include('apps.core.announcement.urls', 'announcement')),
    url(r'^v1/todolist/', include('apps.core.todo.urls', 'todo_list')),
    url(r'^v1/auth/change_password/', ChangePasswordView.as_view(), name='change_password'),
]

if settings.WORKFLOW:
    urlpatterns += [
        url(r'^v1/workflow/', include('apps.workflow.api.urls', 'workflow')),
    ]

if settings.DMS:
    urlpatterns += [
        url(r'^v1/dms/documents/', include('apps.dms.api.document.urls', 'documents')),
        url(r'^v1/dms/', include('apps.dms.api.urls', 'dms')),
    ]
