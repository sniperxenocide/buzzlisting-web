from django.conf.urls import url, include
from django.conf.urls.static import static
from django.conf import settings
from rest_framework import routers

router = routers.DefaultRouter()

urlpatterns = [
    url(r'^', include('apps.core.urls')),
]

if settings.DEBUG:
    urlpatterns = urlpatterns + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT, show_indexes=True)
    urlpatterns = urlpatterns + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT, show_indexes=True)

    import debug_toolbar

    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]
