from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView


# @method_decorator(login_required, name='get')
class DashboardView(TemplateView):
    template_name = 'core/dashboard/dashboard.html'
