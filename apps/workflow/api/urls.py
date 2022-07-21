from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from apps.workflow.bpmn.views import *

router = DefaultRouter()

# bpmn api
router.register('category', CategoryViewSet, base_name='category')
router.register('project', ProjectViewSet, base_name='project')
router.register('task', TaskViewSet, base_name='task')
router.register('route', RouteViewSet, base_name='route')
router.register('eform', EFormViewSet, base_name='eform')
router.register('app_comment', AppCommentView, base_name='app_comment')
router.register('variable', VariableViewSet, base_name='variable')
router.register('step', StepViewSet, base_name='step')
router.register('application', ApplicationViewSet, base_name='application')
router.register('delegation', DelegationViewSet, base_name='delegation')
router.register('general_info', GeneralInfoViewSet, base_name='general_info')
router.register('upload_document', UploadDocumentViewSet, base_name='upload_document')
router.register('generated_document', GeneratedDocumentViewSet, base_name='generated_document')
router.register('process_map', ProcessMapViewSet, base_name='process_map')
router.register('pending_task', PendingTaskViewSet, base_name='pending_task')
router.register('getkpi', KPIView, base_name='getkpi')
router.register('condition', ConditionViewSet, base_name='condition')
router.register('task_op', TaskOpViewSet, base_name='task_op')
router.register('task_rule', TaskRuleViewSet, base_name='task_rule')
router.register('template', TemplateViewSet, base_name='template')
router.register('output_document', OutputDocumentViewSet, base_name='output_document')
router.register('delegation_report', DelegationReportViewset, base_name='delegation_report')
router.register('supervisor', SupervisorViewSet, base_name='supervisor')
router.register('app_count', ApplicationCountViewSet, base_name='app_count')
router.register('reassign', ReassignmentViewSet, base_name='reassign')
router.register('weekend', WeekendViewSet, base_name='weekend')
router.register('holiday', HolidayViewSet, base_name='holiday')
router.register('app_query', AppQueryViewSet, base_name='app_query')  # azmi
router.register('query_inbox', QueryInboxViewSet, base_name='query_inbox')  # azmi
router.register('query_variable', QueryVariableViewSet, base_name='query_variable')  # azmi
router.register('count', CountViewSet, base_name='count')  # azmi
router.register('app_monitor', AppMonitorViewSet, base_name='app_monitor')  # azmi


urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^search/', application_search, name='search'),
]
