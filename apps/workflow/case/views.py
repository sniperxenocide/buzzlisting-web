import json
from django.db.models import Q
from django.utils import timezone
from django.urls import reverse_lazy
from django.views.generic import TemplateView
from rest_framework.decorators import authentication_classes, permission_classes

from apps.workflow.bpmn.models import Delegation, Task, Application, AppQuery
from conf import licensed
from django.shortcuts import render



@property
def sidebar_menu(self):
    sidebar = []
    inbox_queryset = Delegation.objects.filter(user=self.request.user, status=1)
    permissions = self.request.session['permission_list']
    inbox_count = inbox_queryset.count()
    draft_count = Delegation.objects.filter(user=self.request.user, status=2).count()
    risk_count = inbox_queryset.filter(Q(risk_date__lte=timezone.now()) & Q(due_date__gt=timezone.now())).count()
    overdue_count = inbox_queryset.filter(Q(due_date__lt=timezone.now()) &
                                           Q(risk_date__lt=timezone.now())).count()
    completed_count = Delegation.objects.filter(user=self.request.user, status=0).count()
    non_claimed_count = Delegation.objects.filter(user=self.request.user, status=3).count()
    query_count = AppQuery.objects.filter(user_to=self.request.user, is_answered=False).count()

    if self.request.user.role.id == 1:
        sidebar.append(
            ['allowed', 'New Application', reverse_lazy('workflow:case:new_case'), 'zmdi-plus-circle', []])
        sidebar.append(['allowed', 'Application', '#', 'zmdi-case', [
            ['allowed', 'Inbox ({})'.format(inbox_count),
             reverse_lazy('workflow:case:inbox'), 'zmdi-inbox', []],
            ['allowed', 'Draft ({})'.format(draft_count), reverse_lazy('workflow:case:draft'), 'zmdi-edit', []],
            ['allowed', 'Query ({})'.format(query_count), reverse_lazy('workflow:case:query'), 'zmdi-help-outline',
             []],
            ['allowed', 'Risk ({})'.format(risk_count), reverse_lazy('workflow:case:risk'), 'zmdi-alarm',
             []],
            ['allowed', 'OverDue ({})'.format(overdue_count), reverse_lazy('workflow:case:overdue'), 'zmdi-arrow-missed',
             []],
            ['allowed', 'Non Claimed ({})'.format(non_claimed_count), reverse_lazy('workflow:case:non_claimed'),
             'zmdi-forward', []],
            ['allowed', 'Reassign', reverse_lazy('workflow:case:reassign'),
             'zmdi-refresh-sync', []],
            ['allowed', 'Completed ({})'.format(completed_count), reverse_lazy('workflow:case:participated'),
             'zmdi-check-square', []],
        ]], )
    else:
        # new application submit permission
        if 4 in permissions:
            sidebar.append(
                ['allowed', 'New Application', reverse_lazy('workflow:case:new_case'), 'zmdi-plus-circle', []])

        # check if permission for all cases
        if 3 in permissions:
            sidebar.append(['allowed', 'Application', '#', 'zmdi-case', [
                ['allowed', 'Inbox ({})'.format(inbox_count), reverse_lazy('workflow:case:inbox'), 'zmdi-inbox',
                 []],
                ['allowed', 'Draft ({})'.format(draft_count), reverse_lazy('workflow:case:draft'), 'zmdi-edit',
                 []],
                ['allowed', 'Query ({})'.format(query_count), reverse_lazy('workflow:case:query'), 'zmdi-help-outline',
                 []],
                ['allowed', 'Risk ({})'.format(risk_count), reverse_lazy('workflow:case:risk'), 'zmdi-alarm',
                 []],
                ['allowed', 'OverDue ({})'.format(overdue_count), reverse_lazy('workflow:case:overdue'),
                 'zmdi-arrow-missed',
                 []],
                ['allowed', 'Non Claimed ({})'.format(non_claimed_count), reverse_lazy('workflow:case:non_claimed'),
                 'zmdi-forward', []],
                # ['allowed', 'Risk ({})'.format(draft_count), reverse_lazy('workflow:case:draft'), 'zmdi-alarm',
                #  []],
                ['allowed', 'Reassign', reverse_lazy('workflow:case:reassign'),
                 'zmdi-refresh-sync', []],
                ['allowed', 'Completed ({})'.format(completed_count), reverse_lazy('workflow:case:participated'),
                 'zmdi-forward', []],
            ]])

    return sidebar


class InboxView(TemplateView):
    sidebar_menu = sidebar_menu
    extra = ""
    template_name = 'workflow/cases/cases.html'


class MailLink(InboxView):
    template_name = 'workflow/cases/link.html'

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        return self.render_to_response(context)


class RiskView(TemplateView):
    sidebar_menu = sidebar_menu
    extra = "&due_status=risk"
    template_name = 'workflow/cases/cases.html'


class QueryView(TemplateView):
    sidebar_menu = sidebar_menu
    extra = "query"
    template_name = 'workflow/cases/query_list.html'


class OverdueView(TemplateView):
    sidebar_menu = sidebar_menu
    extra = "&due_status=due"
    template_name = 'workflow/cases/cases.html'


class DraftView(InboxView):
    extra = "draft"
    template_name = 'workflow/cases/draft.html'


class ParticipateView(InboxView):
    template_name = 'workflow/cases/participated.html'


class ReassignView(InboxView):
    template_name = 'workflow/cases/reassign.html'


class NonClaimedView(InboxView):
    template_name = 'workflow/cases/non_claimed.html'


class UnassignedView(InboxView):
    template_name = 'workflow/cases/unassigned.html'


class Paused(InboxView):
    template_name = 'workflow/cases/paused.html'


class NewCaseView(InboxView):
    out_open = ''
    task_id = ''
    template_name = 'workflow/cases/new_case.html'


class NewApplicationOpen(TemplateView):
    out_open = 1
    task_id = licensed.OUT_TASK_ID
    out_user = licensed.OUT_USER
    out_password = licensed.OUT_PASSWORD
    template_name = 'workflow/cases/new_case_open.html'


# class NewCaseForm(InboxView):
#     template_name = 'workflow/cases/new_case_form.html'
#
#     @staticmethod
#     def get_object_or_none(model, application_id):
#         try:
#             if application_id is None:
#                 return None
#             return model.objects.get(application_id=application_id)
#         except model.DoesNotExist:
#             return None
#
#     def get(self, request, *args, **kwargs):
#         context = self.get_context_data(**kwargs)
#         context['sidebar_menu'] = context['permission'] = self.sidebar_menu
#         context['client'] = ''
#         context['task'] = {'name': 'Capture Information'}
#         return self.render_to_response(context)


class CommonCaseForm(InboxView):
    template_name = 'workflow/cases/common_case_form.html'
    user = ''

    def get_context_data(self, **kwargs):
        context = super(CommonCaseForm, self).get_context_data(**kwargs)
        context['task'] = Task.objects.get(pk=kwargs.get('task'))
        context['app'] = Application.objects.get(pk=kwargs.get('app'))
        context['variables'] = json.loads(context['app'].data)
        return context


class EFormView(InboxView):
    template_name = 'workflow/cases/e_form.html'


class EFormViewHistory(InboxView):
    customer = licensed.CLIENT_NAME
    extra = "history"
    template_name = 'workflow/bpmn/eform_history_show.html'

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        return self.render_to_response(context)
