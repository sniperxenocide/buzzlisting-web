import operator
from rest_framework import permissions
from rest_framework import serializers, viewsets
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.workflow.email.models import Email
from functools import reduce
from django.db.models import Q


class EmailSerializer(serializers.ModelSerializer):
    taskinfo = serializers.SerializerMethodField('getTask')
    projectinfo = serializers.SerializerMethodField('getProject')

    def getTask(self, obj):
        task = dict()
        task['process'] = obj.task.process
        task['task_name'] = obj.task.name
        task['type'] = obj.task.type.replace("bpmn:", "")
        return task

    def getProject(self, obj):
        project = dict()
        project['project_name'] = obj.project.title
        return project

    class Meta:
        model = Email
        fields = '__all__'


class EmailLogViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    pagination_class = LargeResultsSetPagination
    serializer_class = EmailSerializer
    model = Email
    queryset = Email.objects.all()
    change_keys = {
        'taskinfo.type': 'task__type',
        'projectinfo.project_name': 'project__title'
    }

    search_keywords = ['subject', 'task__name', 'task__process', 'task__id', 'sender', 'receiver', 'project__title',
                       'task__type']
    permission_id = [21, ]

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(date__range=[date_from, date_to])

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)
        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()

        return queryset

