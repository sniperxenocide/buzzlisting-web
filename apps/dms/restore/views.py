from django.urls import reverse_lazy

from django.views.generic import TemplateView

from apps.core.admin.views import admin_sidebar_menu


class RestoreData(TemplateView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'dms/restore/restore_data.html'
