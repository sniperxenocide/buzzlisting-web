from django.conf.urls import url
from .views import *

urlpatterns = [
    url(r'^inbox/$', InboxView.as_view(), name='inbox'),
    url(r'^risk/$', RiskView.as_view(), name='risk'),
    url(r'^query/$', QueryView.as_view(), name='query'),
    url(r'^overdue/$', OverdueView.as_view(), name='overdue'),
    url(r'^new_case$', NewCaseView.as_view(), name='new_case'),
    # url(r'^new_case/(?P<id>[0-9]+)/$', NewCaseForm.as_view(), name='new_case_form'),
    url(r'form/(?P<task>[0-9]+)/(?P<app>[0-9]+)$', CommonCaseForm.as_view(), name='common_case_form'),
    url(r'^link/(?P<task>[0-9]+)/(?P<app>[0-9]+)$', MailLink.as_view(), name='mail_link'),
    url(r'^draft$', DraftView.as_view(), name='draft'),
    url(r'^participated$', ParticipateView.as_view(), name='participated'),
    url(r'^non_claimed', NonClaimedView.as_view(), name='non_claimed'),
    url(r'^unassigned$', UnassignedView.as_view(), name='unassigned'),
    url(r'^reassign', ReassignView.as_view(), name='reassign'),
    url(r'^paused$', Paused.as_view(), name='paused'),
    url(r'^e_form/(?P<id>[0-9]+)/$', EFormView.as_view(), name='e_form'),
    url(r'^e_form_history/(?P<app_id>[0-9]+)/(?P<task_id>[0-9]+)/(?P<delegation_id>[0-9]+)$',
        EFormViewHistory.as_view(), name='e_form_history'),
    # url(r'^wf_email$', WfEmailView.as_view(), name='wf_email'),
    url(r'^account_opening/$', NewApplicationOpen.as_view(), name='account_opening')
]
