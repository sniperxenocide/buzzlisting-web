from django.conf.urls import url, include

urlpatterns = [
    url(r'^categorization/', include('apps.dms.api.category.urls', 'categorization')),
    url(r'^documents/', include('apps.dms.api.document.urls', 'documents')),
    url(r'^departments/', include('apps.dms.api.department.urls', 'departments')),
    url(r'^dms_report/', include('apps.dms.api.dms_activity.urls', 'dms_report')),
]
