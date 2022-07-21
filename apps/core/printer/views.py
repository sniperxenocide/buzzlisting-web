import html
import json
from django.views.generic import TemplateView
from django.views.generic.detail import DetailView

from apps.core.admin.views import admin_sidebar_menu
from apps.workflow.bpmn.models import Application


class PrinterView(DetailView):
    model = Application
    template_name = 'core/printer/index.html'

    def get_context_data(self, **kwargs):
        context = super(PrinterView, self).get_context_data(**kwargs)
        id = self.kwargs.get('pk')
        application = Application.objects.get(id=id)
        context['data'] = Application.objects.get(id=id)
        context['variables'] = json.loads(application.data)
        return context
