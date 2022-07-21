from django.conf.urls import url, include
from django.views.generic import TemplateView
from apps.core.admin.views import admin_sidebar_menu


class CategoryView(TemplateView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'workflow/category/category.html'


urlpatterns = [
    url(r'^$', CategoryView.as_view(), name='view'),
]
