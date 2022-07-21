import html
import json
import operator
import re
from functools import reduce

import elasticsearch
from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.utils.dateparse import parse_date
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from django.core.files.storage import default_storage
from django.db import transaction
from datetime import datetime
from django.db.models import Q
from django.forms.models import model_to_dict
from apps.workflow.bpmn.eForm import EForm as EFormPy
from django.db.models.expressions import F
from django.http import HttpResponseRedirect
from django.views.generic import DetailView
from rest_framework import mixins

from rest_framework import serializers, viewsets
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.core.admin.views import AdminView
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.api.validators import UniqueNameValidator
from apps.workflow.bpmn.elasticsearch import IndexApplication, ApplicationSearch
from apps.workflow.bpmn.engine import BPMNRoute, BPMNEngine

from apps.workflow.bpmn.models import *
from conf import licensed
from django.template.loader import render_to_string

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class CategoryViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = CategorySerializer
    pagination_class = LargeResultsSetPagination
    queryset = Category.objects.all()
    model = Category
    permission_id = [8, ]


class ProjectSerializer(serializers.ModelSerializer):
    assigned_user = serializers.PrimaryKeyRelatedField(read_only=True,
                                                       default=serializers.CurrentUserDefault())
    category_name = serializers.ReadOnlyField(source='category.name')
    assigned_user_name = serializers.ReadOnlyField(source='assigned_user.get_full_name')
    title = serializers.CharField(validators=[
        UniqueNameValidator(
            queryset=Project.objects.all(),
            message='Project with this name already exists.',
            lookup='iexact'
        )
    ])

    class Meta:
        model = Project
        fields = '__all__'


class ProjectViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ProjectSerializer
    pagination_class = LargeResultsSetPagination
    model = Project
    change_keys = {
        'category_name': 'category__name',
        'assigned_user_name': 'assigned_user',
    }
    search_keywords = ['title', 'assigned_user__username', 'category__name']
    permission_id = [2, ]


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.title')
    category_name = serializers.ReadOnlyField(source='project.category.name')
    description = serializers.ReadOnlyField(source='project.description')

    class Meta:
        model = Task
        fields = '__all__'


class TaskViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = TaskSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Task.objects.filter(project__published=True)
    model = Task
    search_keywords = ['project__title', 'project__category__name', 'project__description', 'name']
    change_keys = {
        'project': 'project__title',
        'project_name': 'project__title',
        'category_name': 'project__category__name',
        'description': 'project__description'
    }
    permission_id = [3, 4, ]

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = Task.objects.distinct().get(Q(user=request.user) | Q(group__user=request.user),
                                                   pk=kwargs.get('pk'))
        except Task.DoesNotExist:
            try:
                instance = Task.objects.distinct().get(pk=kwargs.get('pk'),
                                                       task_delegations__status=1,
                                                       task_delegations__user=self.request.user)
            except Task.DoesNotExist:
                raise serializers.ValidationError({'detail': 'You do not have permission to perform this action.'})

        position = 1 if request.query_params.get('position') is None else request.query_params.get('position')
        start_app = request.query_params.get('startapp')
        application = request.query_params.get('application')
        out_open = request.query_params.get('out_open')

        if not instance.start and application is None:
            raise serializers.ValidationError({'detail': 'You must provide the application id.'})

        instance = BPMNEngine(request=request, instance=instance, position=position, start_app=start_app, application=application, out_open=out_open).take_decision()
        return Response(instance)

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        init = self.request.query_params.get('init')

        if init is not None and init == 'true':
            queryset = queryset.filter(start=True, project__published=True)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

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

        queryset = queryset.filter(Q(user=request.user) | Q(group__user=request.user)).distinct()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# class CheckTaskSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Task
#         fields = '__all__'
#
#
# class CheckTaskViewSet(CustomViewSetForQuerySet):
#     permission_classes = [GreenOfficeApiBasePermission]
#     serializer_class = CheckTaskSerializer
#     pagination_class = LargeResultsSetPagination
#     permission_id = [3, 4, ]
#     queryset = Task.objects.all()
#     model = Task
#     # http_method_names = ['get']
#
#     def create(self, request, *args, **kwargs):
#         # task_id = self.request.data.get('task')
#         # next_pos = self.request.data.get('next_pos')
#         # application = self.request.data.get('application')
#         # task = Task.objects.get(pk=task_id)
#         # condition = BPMNEngine(request=request, instance=task, position=next_pos,
#         #                        application=application).type_switcher(do_delegation=False)
#         # print("condition", condition)
#         # next_task_type = Route.objects.get(source=task_id).target.type
#
#
#         # if next_task_type == 'bpmn:EndEvent':
#         #     return Response('end')
#         # elif next_task_type == 'bpmn:ExclusiveGateway':
#         #     task = Task.objects.get(pk=task_id)
#         #     condition = BPMNEngine(request=request, instance=task, position=next_pos, application=application)\
#         #         .check_condition()
#         #     print("condition", condition)
#         return Response(1)


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'


class RouteViewSet(CustomViewSetForQuerySet, mixins.CreateModelMixin, GenericViewSet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = RouteSerializer
    queryset = Route.objects.all()
    permission_id = [2, ]
    model = Route
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):

        # get project id
        try:
            project = request.data.get('project')

            if project is not None:
                project = Project.objects.get(pk=project)
            else:
                raise serializers.ValidationError({'detail': 'No Project specified'})

        except KeyError:
            raise serializers.ValidationError({'detail': 'No Project specified'})

        # get process list
        try:
            process = json.loads(request.data.get('process'))

            if process is None:
                raise serializers.ValidationError({'detail': 'No process specified'})
        except KeyError:
            raise serializers.ValidationError({'detail': 'No process specified'})
        # with transaction.atomic():
        # Process Validation
        if len(process) > 0:
            for p in process:
                flows = p.get('flow')
                process_id = p.get('process')
                start_event_count = 0

                if len(flows) > 0:
                    for f in flows:
                        # check if there is multiple start
                        if f.get('type') == 'bpmn:StartEvent':
                            start_event_count += 1

                            if start_event_count > 1:
                                raise serializers.ValidationError({'detail': 'Process: {0} can not contain multiple '
                                                                             'bpmn:StartEvent'.format(process_id)})

                            if f.get('target') is not None and len(f.get('target')) > 1:
                                raise serializers.ValidationError({'detail': 'bpmn:StartEvent can not contain multiple '
                                                                             'Task in {0}.'.format(process_id)})

                        # check it there is multiple task for this any task
                        if f.get('type') == 'bpmn:Task':
                            if f.get('target') is not None and len(f.get('target')) > 1:
                                raise serializers.ValidationError({'detail': 'Task should not have multiple node.'})

        # Create task
        if len(process) > 0:
            for p in process:
                flows = p.get('flow')
                process_id = p.get('process')

                if len(flows) > 0:
                    for f in flows:
                        source = f.get('source')
                        target = f.get('target')
                        task_element = [source, target]

                        params = {
                            'element_id': f.get('id'),
                            'name': f.get('name', None),
                            'process': process_id,
                            'project': project,
                            'type': f.get('type')
                        }

                        BPMNRoute.create_or_update_task(params)

                        for element in task_element:
                            if element is not None and element != '':
                                for e in element:
                                    params = {
                                        'element_id': e.get('id'),
                                        'name': e.get('name', None),
                                        'process': process_id,
                                        'project': project,
                                        'type': e.get('type')
                                    }

                                    BPMNRoute.create_or_update_task(params)

        # Make task as initiator
        if len(process) > 0:
            for p in process:
                flows = p.get('flow')
                process_id = p.get('process')

                if len(flows) > 0:
                    for f in flows:
                        if f.get('type') == 'bpmn:StartEvent' and f.get('target') is not None:
                            for t in f.get('target'):
                                previous_initiator = Task.objects.filter(process=process_id, project=project.id,
                                                                         start=True)

                                if previous_initiator:
                                    for p_i in previous_initiator:
                                        p_i.start = False
                                        p_i.save()

                                try:
                                    task = Task.objects.get(element_id=t.get('id'), project=project.id,
                                                            process=process_id)
                                    task.start = True
                                    task.save()
                                except Task.DoesNotExist:
                                    pass

        # Create route
        if len(process) > 0:
            for p in process:
                flows = p.get('flow')
                process_id = p.get('process')

                if len(flows) > 0:
                    for f in flows:
                        target = f.get('target')
                        route_element = [target]

                        for r_el in route_element:
                            if r_el is not None:
                                for el in r_el:
                                    params = {
                                        'source': Task.objects.get(element_id=f.get('id'), project=project.id,
                                                                   process=process_id),
                                        'target': Task.objects.get(element_id=el.get('id'), project=project.id,
                                                                   process=process_id),
                                        'project': project,
                                        'process': process_id,
                                        'type': f.get('type')
                                    }

                                    try:
                                        Route.objects.get(**params)
                                    except Route.DoesNotExist:
                                        Route.objects.create(**params)

        # Clean up Task and Route
        if len(process) > 0:
            for p in process:
                flows = p.get('flow')
                process_id = p.get('process')
                task_list_in_project = Task.objects.filter(project=project.id, process=process_id)
                route_list_in_project = Route.objects.filter(project=project.id, process=process_id)

                if len(flows) > 0:
                    for f in flows:
                        source = f.get('source')
                        target = f.get('target')
                        gather_element = [source, target]
                        task_list_in_project = task_list_in_project.exclude(element_id=f.get('id'))

                        for g_el in gather_element:
                            if g_el is not None:
                                for el in g_el:
                                    task_list_in_project = task_list_in_project.exclude(element_id=el.get('id'))

                        try:
                            source_id = Task.objects.get(project=project.id, process=process_id,
                                                         element_id=f.get('id'))
                            for t_el in target:
                                target_id = Task.objects.get(project=project.id, process=process_id,
                                                             element_id=t_el.get('id'))

                                route_list_in_project = route_list_in_project.exclude(source=source_id,
                                                                                      target=target_id)

                        except (Task.DoesNotExist, IndexError, TypeError):
                            pass

                task_list_in_project.delete()
                route_list_in_project.delete()

        # Clean up garbage process
        if len(process) > 0:
            process_list_in_project = Task.objects.filter(project=project.id)

            for p in process:
                process_id = p.get('process')
                process_list_in_project = process_list_in_project.exclude(process=process_id)

            process_list_in_project.delete()

        # raise
        # self.perform_create(serializer)
        # headers = self.get_success_headers(serializer.data)
        # return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return Response('okay')


class ConditionSerializer(serializers.ModelSerializer):
    target_name = serializers.ReadOnlyField(source='target.name', read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'target_id', 'target_name', 'condition']
        read_only_fields = ['id', 'project', 'process', 'name', 'type', 'email', 'source', 'target']


class ConditionViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ConditionSerializer
    permission_id = [2, ]
    model = Route

    def create(self, request, *args, **kwargs):
        return Response('There is nothing to create here.')

    def retrieve(self, request, *args, **kwargs):
        return Response('There is nothing to retrieve here.')

    def destroy(self, request, *args, **kwargs):
        return Response('There is nothing to destroy here.')

    def list(self, request, *args, **kwargs):
        project = request.query_params.get('project')
        if not project:
            raise serializers.ValidationError({'detail': 'Please send project id with "project" parameter.'})
        process = request.query_params.get('process')
        if not process:
            raise serializers.ValidationError({'detail': 'Please send process id with "process" parameter.'})
        gateway = request.query_params.get('gateway')
        if not gateway:
            raise serializers.ValidationError({'detail': 'Please send gateway id with "gateway" parameter.'})

        try:
            element = Task.objects.get(project=project, process=process, element_id=gateway,
                                       type='bpmn:ExclusiveGateway')
            serializer = self.get_serializer(Route.objects.filter(source=element), many=True)
            return Response(serializer.data)
        except Task.DoesNotExist:
            raise serializers.ValidationError({'detail': 'No gateway found using this id: {}.'.format(gateway)})


class TaskOpSerializer(serializers.ModelSerializer):
    available_users = serializers.SerializerMethodField(read_only=True)
    available_groups = serializers.SerializerMethodField(read_only=True)
    assigned_users = serializers.SerializerMethodField(read_only=True)
    assigned_groups = serializers.SerializerMethodField(read_only=True)
    all_users = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_available_users(obj):
        return User.objects.exclude(id__in=[u.id for u in obj.user.all()]).filter(
            ~Q(status=0) & ~Q(status=2) & ~Q(status=3)).values('id', 'first_name', 'last_name', 'username')

    @staticmethod
    def get_available_groups(obj):
        return Group.objects.exclude(id__in=[u.id for u in obj.group.all()]).values('id', 'name')

    @staticmethod
    def get_assigned_users(obj):
        return obj.user.values('id', 'first_name', 'last_name', 'username')

    @staticmethod
    def get_assigned_groups(obj):
        return obj.group.values('id', 'name')

    @staticmethod
    def get_all_users(obj):
        users = []

        for u in TaskOpSerializer.get_assigned_users(obj):
            users.append(u)

        for g in obj.group.prefetch_related('user'):
            for u in g.user.values('id', 'first_name', 'last_name', 'username'):
                users.append(u)

        return list({v['id']: v for v in users}.values())

    class Meta:
        fields = ['id', 'available_users', 'available_groups', 'assigned_users', 'assigned_groups', 'user', 'group',
                  'rules_applied', 'assignment_type', 'project', 'all_users', 'duration']
        read_only_fields = ['id', 'project', 'process', 'element_id', 'type', 'start', 'rules_applied', 'all_users']
        extra_kwargs = {
            'user': {'write_only': True},
            'group': {'write_only': True},
        }
        model = Task


class TaskOpViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = TaskOpSerializer
    permission_id = [2, ]
    model = Task

    def create(self, request, *args, **kwargs):
        return Response('There is nothing to create here.')

    def destroy(self, request, *args, **kwargs):
        return Response('There is nothing to destroy here.')

    def list(self, request, *args, **kwargs):
        project = request.query_params.get('project')
        if not project:
            raise serializers.ValidationError({'detail': 'Please send project id with "project" parameter.'})

        process = request.query_params.get('process')
        if not process:
            raise serializers.ValidationError({'detail': 'Please send process id with "process" parameter.'})

        task = request.query_params.get('task')
        if not task:
            raise serializers.ValidationError({'detail': 'Please send task html element id with "task" parameter.'})

        try:
            element = Task.objects.get(project=project, process=process, element_id=task, type='bpmn:Task')
            serializer = self.get_serializer(element, many=False)
            return Response(serializer.data)
        except Task.DoesNotExist:
            raise serializers.ValidationError({'detail': 'No task found using this id: {}.'.format(task)})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if request.data.get('user') is not None:
            if len(request.data.get('user')) == 0:
                TaskRule.objects.filter(task=instance).delete()
            else:
                TaskRule.objects.exclude(user__id__in=request.data.get('user')).filter(task=instance).delete()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        return Response(serializer.data)


class SupervisorSerializer(serializers.ModelSerializer):
    available_users = serializers.SerializerMethodField(read_only=True)
    assigned_users = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_available_users(obj):
        return User.objects.exclude(id__in=[u.id for u in obj.supervisors.all()]).filter(
            ~Q(status=0) & ~Q(status=2) & ~Q(status=3)).values('id', 'first_name', 'last_name', 'username')

    @staticmethod
    def get_assigned_users(obj):
        return obj.supervisors.values('id', 'first_name', 'last_name', 'username')

    class Meta:
        fields = ['id', 'available_users', 'assigned_users', 'supervisors']
        read_only_fields = ['id']
        extra_kwargs = {
            'supervisors': {'write_only': True},
        }
        model = Project


class SupervisorViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = SupervisorSerializer
    permission_id = [2, ]
    model = Project

    def create(self, request, *args, **kwargs):
        return Response('There is nothing to create here.')

    def destroy(self, request, *args, **kwargs):
        return Response('There is nothing to destroy here.')

    @staticmethod
    def bool_return(variable):
        if variable is None or variable is False:
            return False

        if variable:
            return True


class TaskRuleSerializer(serializers.ModelSerializer):
    available_users = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_available_users(obj):
        return obj.task.user.values('id', 'username', 'first_name', 'last_name')

    class Meta:
        fields = '__all__'
        read_only_fields = ['id']
        model = TaskRule


class TaskRuleViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = TaskRuleSerializer
    permission_id = [2, ]
    model = TaskRule

    def list(self, request, *args, **kwargs):
        project = request.query_params.get('project')
        if not project:
            raise serializers.ValidationError({'detail': 'Please send project id with "project" parameter.'})
        process = request.query_params.get('process')
        if not process:
            raise serializers.ValidationError({'detail': 'Please send process id with "process" parameter.'})
        task = request.query_params.get('task')
        if not task:
            raise serializers.ValidationError({'detail': 'Please send gateway id with "task" parameter.'})

        try:
            element = Task.objects.get(project=project, process=process, element_id=task, type='bpmn:Task')
            element = TaskRule.objects.filter(task=element)
            serializer = self.get_serializer(element, many=True)
            return Response(serializer.data)
        except Task.DoesNotExist:
            raise serializers.ValidationError({'detail': 'No task found using this id: {}.'.format(task)})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = Task.objects.get(pk=request.data.get('task'))

        if not task.user.filter(pk=request.data.get('user')).count():
            raise serializers.ValidationError({'detail': 'User with pk {} not found in this '
                                                         'task'.format(request.data.get('user'))})

        self.perform_create(serializer)
        task.cyclic_assignment = True
        task.manual_assignment = False
        task.rules_applied = True
        task.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if request.data.get('user'):
            if not instance.task.user.filter(pk=request.data.get('user')).count():
                raise serializers.ValidationError({'detail': 'User with pk {} not found in this '
                                                             'task'.format(request.data.get('user'))})

        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # refresh the instance from the database.
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        task = instance.task
        self.perform_destroy(instance)

        if not task.task_based_rules.count():
            task.rules_applied = False
            task.cyclic_assignment = True
            task.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class EFormSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if data['title'] is not None and data['title'] != '':
            data['title'] = " ".join(data['title'].split())
            queryset = EForm.objects.filter(title__iexact=data['title'], project=data['project'].id).values('id')

            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if len(queryset) > 0:
                raise serializers.ValidationError({'detail': 'Eform with this name already exists'})

        return data

    class Meta:
        model = EForm
        fields = '__all__'


class EFormViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = EFormSerializer
    pagination_class = LargeResultsSetPagination
    model = EForm
    search_keywords = ['label', 'project__title']
    permission_id = [2, ]
    queryset = EForm.objects.all()

    def list(self, request, *args, **kwargs):
        project = self.request.query_params.get('project')

        if project is None:
            raise serializers.ValidationError({'detail': 'Please set project parameter'})

        queryset = self.filter_queryset(self.get_queryset()).filter(project=project)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class VariableSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if data['name'] is not None and data['name'] != '':

            data['name'] = " ".join(data['name'].split())
            queryset = Variable.objects.filter(name__exact=data['name'], project=data['project'].id).values('id')

            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if len(queryset) > 0:
                raise serializers.ValidationError({'detail': 'Variable with this name already exists'})

        return data

    class Meta:
        model = Variable
        fields = '__all__'


class VariableViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    pagination_class = LargeResultsSetPagination
    serializer_class = VariableSerializer
    model = Variable
    permission_id = [2, ]

    def get_queryset(self):
        queryset = self.model.objects.all()
        project = self.request.query_params.get('project', None)

        if project is not None:
            queryset = Variable.objects.filter(project=project)

        return queryset


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        read_only_fields = ['location']
        model = Template


class TemplateViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    pagination_class = LargeResultsSetPagination
    serializer_class = TemplateSerializer
    model = Template
    permission_id = [2, ]

    def create(self, request, *args, **kwargs):
        content = request.data.get('content')
        if content is None:
            raise serializers.ValidationError(
                {'detail': 'You have to set content parameter and content should be html string.'})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        path = default_storage.save('templates/{}.html'.format(request.data.get('file_name')), ContentFile(content))
        template_dict = serializer.data
        template_dict.update({'location': path, 'project': Project.objects.get(pk=request.data.get('project'))})

        try:
            template_dict.pop('content')
        except KeyError:
            pass

        template = Template.objects.create(**template_dict)
        return Response({
            'id': template.id,
            'project': template.project.id,
            'file_name': template.file_name,
            'location': template.location
        }, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        project = self.request.query_params.get('project')

        if project is None:
            raise serializers.ValidationError({'detail': 'You have to set project parameter.'})

        queryset = self.model.objects.filter(project=project)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        content = html.escape(str(default_storage.open(instance.location).read(), 'utf-8'))
        template_dict = serializer.data
        template_dict.update({'content': content})
        return Response(template_dict)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        content = request.data.get('content')

        if content:
            if default_storage.exists(instance.location):
                default_storage.open(instance.location, 'w').write(content)
            else:
                default_storage.save(instance.location, ContentFile(content))

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # refresh the instance from the database.
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        default_storage.delete(instance.location)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OutputDocumentSerializer(serializers.ModelSerializer):
    slug_regex = re.compile(r'^[a-zA-Z0-9_]{4,200}$')
    generated_name = serializers.RegexField(regex=slug_regex, error_messages={
        'invalid': 'generated_name contains alphanumeric and underscores. Length: 4 to 200'
    })

    class Meta:
        fields = '__all__'
        model = OutputDocument


class OutputDocumentViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    pagination_class = LargeResultsSetPagination
    serializer_class = OutputDocumentSerializer
    model = OutputDocument
    permission_id = [2, ]

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        project = self.request.query_params.get('project')

        if project is None:
            raise serializers.ValidationError({'detail': 'You have to set project parameter.'})

        queryset = self.model.objects.filter(project=project)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = '__all__'


class StepViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = StepSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Step.objects.all()
    permission_id = [2, ]
    model = Step

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        task = self.request.query_params.get('task')

        if task is None:
            raise serializers.ValidationError({'detail': 'You have to set task parameter.'})

        queryset = self.model.objects.filter(task=task)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        queryset = queryset.order_by('position')
        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'


class ApplicationViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ApplicationSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Application.objects
    permission_id = [3, 25, ]
    model = Application

    def list(self, request, *args, **kwargs):
        queryset = self.queryset.filter(init_user=request.user)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if request.data.get('application') is None or not request.data.get('application'):
            raise serializers.ValidationError({'detail': 'Please provide the application id.'})

        if request.data.get('task') is None or not request.data.get('task'):
            raise serializers.ValidationError({'detail': 'Please provide the task id.'})

        if request.data.get('project') is None or not request.data.get('project'):
            raise serializers.ValidationError({'detail': 'Please provide the project id.'})

        d_dict = {}
        task = Task.objects.get(pk=request.data['task'])
        app = Application.objects.get(pk=request.data.get('application'))
        app_data = json.loads(app.data)

        for tuple_item in request.data.lists():

            if 'grid-' in tuple_item[0]:
                extracted_name = tuple_item[0].split('-')
                if len(tuple_item[1]):
                    for i, t in enumerate(tuple_item[1]):
                        try:
                            try:
                                d_dict[extracted_name[1]][i].update({extracted_name[2]: t})
                            except IndexError:
                                d_dict[extracted_name[1]].insert(i, {extracted_name[2]: t})

                        except KeyError:
                            d_dict.update({extracted_name[1]: []})
                            d_dict[extracted_name[1]].insert(i, {extracted_name[2]: t})

            elif 'checkgroup-' in tuple_item[0]:
                d_dict[tuple_item[0].replace('checkgroup-', '')] = tuple_item[1]

            else:
                ignored_keys = ['manual_final_user', 'next_pos', 'task', 'application', 'project', 'process',
                                'manual', 'claimed_user', 'claiming']

                if 'file' not in tuple_item[0] and tuple_item[0] not in ignored_keys:
                    try:
                        d_dict[tuple_item[0]] = tuple_item[1][0]
                    except IndexError:
                        d_dict[tuple_item[0]] = ''

        # update application data
        app_data.update(d_dict)
        if len(request.FILES) > 0:
            with transaction.atomic():
                for l in request.FILES:
                    o = []

                    InputDocument.objects.filter(**{
                        'project': Project.objects.get(pk=request.data.get('project')),
                        'process': request.data['process'],
                        'application': app,
                        'variable': l
                    }).delete()

                    for f in request.FILES.getlist(l):
                        input_doc = InputDocument.objects.create(**{
                            'project': Project.objects.get(pk=request.data.get('project')),
                            'process': request.data['process'],
                            'task': task,
                            'application': app,
                            'size': f.size,
                            'name': f.name,
                            'extension': f.content_type,
                            'file': f,
                            'user': request.user,
                            'variable': l
                        })
                        f_dict = dict()
                        f_dict['location'] = input_doc.file.__str__()
                        f_dict['name'] = input_doc.name
                        o.append(f_dict)
                    d_dict.update({
                        l: o
                    })

        app_data.update(d_dict)
        app.data = json.dumps(app_data)
        app.current_user = request.user
        #app.save()

        try:
            IndexApplication(app)
            app.save()
        except elasticsearch.ConnectionError:
            return Response('Please check your search engine connection is down or not',
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('save_as_draft') and int(request.data.get('save_as_draft')) == 1:
            result = {'detail': 'Draft has been saved.', 'type': 'draft'}
        elif request.data.get('_reject_') and int(request.data.get('_reject_')) == 1:
            bpmne_obj = BPMNEngine(request, task, request.data['next_pos'], application=app.id)
            if licensed.CLIENT_NAME == 'aw6io2a' and task.project.title == 'EBL CARD CUSTOMER SERVICE FORM' and task.name != 'Documentation':
                result = bpmne_obj.take_decision('reject')
            else:
                if bpmne_obj.end_event_operation('reject'):
                    response_dict = {
                        'type': 'task',
                        'manual': False,
                        'end': False,
                        'parallel': False,
                        'application': model_to_dict(app)
                    }
                    result = dict(response_dict, **{
                        'end': True,
                        'detail': 'The application has been rejected',
                        'reject': True,
                    })
            bpmne_obj.workflow_send_mail(button_action='reject')
        elif request.data.get('_recheck_') and int(request.data.get('_recheck_')) == 1:
            result = BPMNEngine(request, task, request.data['next_pos'], application=app.id).take_decision('recheck')
        elif request.data.get('manual') == 'true':
            manual_final_user = request.data.get('manual_final_user')
            result = BPMNEngine(request, task, request.data['next_pos'], application=app.id, manual_pass=True,
                                manual_final_user=manual_final_user).take_decision()
        elif request.data.get('claiming'):
            claimed_user = request.data.get('claimed_user')
            result = BPMNEngine(request, task, request.data['next_pos'], application=app.id, manual_pass=True,
                                manual_final_user=claimed_user, claimed=True).claim_operation(claimed_user)
        else:
            result = BPMNEngine(request, task, request.data['next_pos'], application=app.id).take_decision()

        return Response(result, status=status.HTTP_202_ACCEPTED)


class ApplicationCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delegation
        fields = '__all__'


class ApplicationCountViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ApplicationCountSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Delegation.objects.filter()
    http_method_names = ['get']
    model = Delegation
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        status_dict = {
            'completed': 0,
            'todo': 1,
            'open': 2,
            'non_claimed': 3,
        }
        count_dic = {}
        for k, v in sorted(status_dict.items()):
            number = Delegation.objects.filter(status=v, user=request.user).count()
            count_dic[k] = number
        return Response(count_dic)


class DelegationSerializer(serializers.ModelSerializer):
    task_name = serializers.StringRelatedField(source='task.name')
    task = serializers.StringRelatedField(source='task.id')
    task_element_id = serializers.StringRelatedField(source='task.element_id')
    project_category = serializers.StringRelatedField(source='project.category.name')
    project_name = serializers.StringRelatedField(source='project.title')
    app_id = serializers.StringRelatedField(source='application.id')
    app_number = serializers.StringRelatedField(source='application.number')
    user = serializers.StringRelatedField(source='user.get_full_name')
    sent_by = serializers.StringRelatedField(source='sent_by.get_full_name')
    actual_task_user = serializers.StringRelatedField(source='actual_task_user.get_full_name')
    comment_count = serializers.SerializerMethodField()
    query_count = serializers.SerializerMethodField()

    @staticmethod
    def get_comment_count(obj):
        return AppComment.objects.filter(application=obj.application.id).count()

    @staticmethod
    def get_query_count(obj):
        return AppQuery.objects.filter(application=obj.application.id).count()

    class Meta:
        model = Delegation
        fields = '__all__'


class DelegationCustomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delegation
        fields = '__all__'


class DelegationViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = DelegationSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Delegation.objects.filter()
    http_method_names = ['get', 'delete']
    model = Delegation
    search_keywords = ['application__number', 'project__title', 'sent_by__first_name', 'sent_by__last_name']
    change_keys = {
        'app_id': 'application__id',
        'app_number': 'application__number',
        'project_name': 'project__title',
        'task_name': 'task__name',
        'priority': 'task__priority',
        # 'due_date': 'task__init_date',
    }
    permission_id = [3, 25, ]

    def destroy(self, request, *args, **kwargs):
        try:
            instance = Delegation.objects.get(pk=kwargs['pk'], user=request.user)
            instance.application.delete()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Delegation.DoesNotExist:
            raise serializers.ValidationError({'detail': 'You do not have permission to perform this action.'})

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        item_status = self.request.query_params.get('item_status')
        due_status = self.request.query_params.get('due_status', None)
        identifier = self.request.query_params.get('id', None)

        if item_status is None or item_status not in ['completed', 'todo', 'open', 'non_claimed']:
            raise serializers.ValidationError({'detail': 'Please provide an item_status (open, todo, completed)'})
        else:
            status_dict = {
                'completed': 0,
                'todo': 1,
                'open': 2,
                'non_claimed': 3,
            }
            queryset = queryset.filter(status=status_dict[item_status]).order_by('-init_date')
            if due_status is not None:
                if due_status not in ['risk', 'due']:
                    raise serializers.ValidationError({'detail': 'Please provide an due_status (risk, due)'})
                else:
                    today_datetime = timezone.now()
                    if due_status == 'risk':
                        queryset = queryset.filter(Q(risk_date__lte=today_datetime) & Q(due_date__gt=today_datetime))
                    else:
                        queryset = queryset.filter(Q(due_date__lt=today_datetime) & Q(risk_date__lt=today_datetime))
        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

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

        if identifier == 'notifier':
            queryset = queryset.filter(user=request.user).order_by('-init_date')
        else:
            queryset = queryset.filter(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PendingTaskViewSet(viewsets.ModelViewSet):
    serializer_class = DelegationSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Delegation.objects.all()
    http_method_names = ['get']
    model = Delegation
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        task_status = self.request.query_params.get('status')
        if task_status is None:
            raise serializers.ValidationError({'detail': 'Please provide an status (risk_task, over_due)'})
        else:
            task_status = task_status.lower()
            if task_status == 'risk_task':
                queryset = Delegation.objects.filter(~(Q(status=0) | Q(status=2)), risk_date__lte=timezone.now(),
                                                     due_date__gt=timezone.now(), user_id=request.user)
            elif task_status == 'over_due':
                queryset = Delegation.objects.filter(~(Q(status=0) | Q(status=2)), due_date__lte=timezone.now(),
                                                     user_id=request.user)
            else:
                raise serializers.ValidationError({'detail': 'Please provide an status risk_task or over_due'})
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class GeneralInfoSerializer(serializers.ModelSerializer):
    process_name = serializers.StringRelatedField(source='project.title', read_only=True)
    init_user_name = serializers.StringRelatedField(source='init_user.get_full_name')
    current_user_name = serializers.StringRelatedField(source='current_user.get_full_name')
    description = serializers.StringRelatedField(source='project.description')
    category = serializers.StringRelatedField(source='project.category')
    process_created_date = serializers.StringRelatedField(source='project.created_at')
    # delegation = DelegationCustomSerializer(many=True, read_only=True)
    delegation = serializers.SerializerMethodField()

    def get_delegation(self, obj):
        l = []
        data_query = Delegation.objects.filter(user=obj.current_user, application=obj)

        def day_convert(time):
            day = int(time) / 24
            hour = int(time) % 24
            return "{} days {} hours".format(day, hour)

        if data_query.filter(status=1).count():
            for delegation in data_query.filter(status=1):
                d = dict()
                d['user'] = delegation.user.get_full_name()
                d['status'] = delegation.status
                d['additional_status'] = delegation.additional_status
                d['finish_date'] = delegation.finish_date
                d['task'] = delegation.task.name
                d['delegation_init_date'] = delegation.init_date
                d['delegation_finish_date'] = delegation.finish_date
                d['delegation_due_date'] = delegation.due_date
                d['duration'] = delegation.task.duration
                duration = delegation.task.duration
                if int(duration) >= 24:
                    final_duration = day_convert(duration)
                    d['duration'] = final_duration
                else:
                    d['duration'] = "{}hours".format(delegation.task.duration)
                l.append(d)

        elif data_query.filter(status=2).count():
            for delegation in data_query.filter(status=2):
                d = dict()
                d['user'] = delegation.user.get_full_name()
                d['status'] = delegation.status
                d['additional_status'] = delegation.additional_status
                d['finish_date'] = delegation.finish_date
                d['task'] = delegation.task.name
                d['delegation_init_date'] = delegation.init_date
                d['delegation_finish_date'] = delegation.finish_date
                d['delegation_due_date'] = delegation.due_date
                d['duration'] = delegation.task.duration
                duration = delegation.task.duration
                if int(duration) >= 24:
                    final_duration = day_convert(duration)
                    d['duration'] = final_duration
                else:
                    d['duration'] = "{}hours".format(delegation.task.duration)
                l.append(d)

        else:
            data = Delegation.objects.filter(application=obj).latest('finish_date')
            d = dict()
            d['user'] = data.user.get_full_name()
            d['status'] = data.status
            d['additional_status'] = data.additional_status
            d['finish_date'] = data.finish_date
            d['task'] = data.task.name
            d['delegation_init_date'] = data.init_date
            d['delegation_due_date'] = data.due_date
            d['delegation_finish_date'] = data.finish_date
            duration = data.task.duration
            if int(duration) >= 24:
                final_duration = day_convert(duration)
                d['duration'] = final_duration
            else:
                d['duration'] = "{}hours".format(data.task.duration)
            l.append(d)

        return l

    class Meta:
        model = Application
        exclude = ['data']


class GeneralInfoViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = GeneralInfoSerializer
    pagination_class = LargeResultsSetPagination
    model = Application
    http_method_names = ['get']
    permission_id = [3, 25, ]


class UploadDocumentSerializer(serializers.ModelSerializer):
    origin_task = serializers.StringRelatedField(source='task.name')

    class Meta:
        model = InputDocument
        fields = '__all__'


class UploadDocumentViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = UploadDocumentSerializer
    pagination_class = LargeResultsSetPagination
    queryset = InputDocument.objects.all()
    model = InputDocument
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        app_id = self.request.query_params.get('app_id')
        document_status = self.request.query_params.get('attach')

        if app_id is None:
            raise serializers.ValidationError({'detail': 'You must provide a valid Application ID. (ex: ?app_id=001)'})

        if document_status is not None:
            if document_status == 'true':
                queryset = self.queryset.filter(application=app_id, attached=True)
            elif document_status == 'false':
                queryset = self.queryset.filter(application=app_id, attached=False)

        else:
            queryset = self.queryset.filter(application=app_id)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        file_lists = serializer.data

        return Response(file_lists)


class GeneratedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedDocument
        fields = '__all__'


class GeneratedDocumentViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = GeneratedDocumentSerializer
    pagination_class = LargeResultsSetPagination
    queryset = GeneratedDocument.objects.all()
    model = GeneratedDocument
    permission_id = [3, 25, ]

    def retrieve(self, request, *args, **kwargs):
        return Response({'detail': 'There is no operation.'})

    def create(self, request, *args, **kwargs):
        return Response({'detail': 'There is no operation.'})

    def update(self, request, *args, **kwargs):
        return Response({'detail': 'There is no operation.'})

    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'There is no operation.'})

    def list(self, request, *args, **kwargs):
        app_id = self.request.query_params.get('app_id')

        if app_id is None:
            raise serializers.ValidationError({'detail': 'You must provide a valid Application ID. (ex: ?app_id=001)'})

        queryset = self.queryset.filter(application=app_id)

        # if not queryset.count():
        #     raise serializers.ValidationError('You must provide a valid Application ID.')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProcessMapSerializer(serializers.ModelSerializer):
    process_name = serializers.StringRelatedField(source='project.title')
    task_name = serializers.StringRelatedField(source='task.name')
    task_id = serializers.StringRelatedField(source='task.id')
    application_number = serializers.StringRelatedField(source='application.number')
    user_name = serializers.StringRelatedField(source='user.get_full_name')
    time_taken = serializers.SerializerMethodField()

    def get_time_taken(self, obj):
        if obj.finish_date:
            return str(obj.finish_date - obj.init_date).split(".")[0]
        else:
            return None

    class Meta:
        model = Delegation
        fields = '__all__'


class ProcessMapViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ProcessMapSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Delegation.objects.all()
    model = Delegation
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        app_id = self.request.query_params.get('app_id')
        is_query = self.request.query_params.get('is_query', None)  #Azmi
        if app_id is None:
            raise serializers.ValidationError({'detail': 'You must provide a valid Application ID. (ex: ?app_id=001)'})

        if is_query is not None:  #Azmi
            if is_query != "1":
                raise serializers.ValidationError({'detail': 'You must provide is_query=1 for query'})
            else:
                queryset = self.queryset.filter(application=app_id, status=0).order_by('user').distinct('user')
        else:
            queryset = self.queryset.filter(application=app_id).order_by('-id')

            if not queryset.count():
                raise serializers.ValidationError({'detail': 'You must provide a valid Application ID.'})

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['POST'])
def application_search(request):
    return Response(ApplicationSearch(request.data).quick_search())


class ProjectList(AdminView):
    category_list = Category.objects.all()
    template_name = 'workflow/bpmn/project.html'

    def get(self, request, *args, **kwargs):
        # check Designs permissions
        with transaction.atomic():
            if request.user.role.permission.filter(id=2).count():
                context = self.get_context_data(**kwargs)
                return self.render_to_response(context)
            else:
                return HttpResponseRedirect('/dashboard')


class ProjectView(DetailView):
    template_name = 'workflow/designer/designer.html'
    model = Project


class EFormView(DetailView):
    model = EForm
    template_name = 'workflow/designer/formbuilder.html'


class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = Delegation
        fields = '__all__'


class KPIView(viewsets.ModelViewSet):
    serializer_class = KPISerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        user = self.request.query_params.get('user', None)
        current_time = timezone.now()

        if user is None:

            if request.user.role.id == 1:
                totaltask = Delegation.objects.filter(~Q(status=2)).count()
                if totaltask:

                    todotask = Delegation.objects.filter(status=1).count()
                    lefttask = todotask * 100 / totaltask

                    if todotask:
                        overdue = Delegation.objects.filter(status=1,
                                                            due_date__lte=current_time).count() * 100 / todotask
                        risktask = Delegation.objects.filter(status=1, risk_date__lte=current_time,
                                                             due_date__gt=current_time).count() * 100 / todotask
                    else:
                        overdue = risktask = 0.0
                    completed = Delegation.objects.filter(status=0).count()
                    completedtask = completed * 100 / totaltask
                    if completed:
                        combeforedue = Delegation.objects.filter(status=0, due_date__gte=F(
                            'finish_date')).count() * 100 / completed
                        comafterdue = Delegation.objects.filter(status=0,
                                                                due_date__lt=F('finish_date')).count() * 100 / completed
                    else:
                        combeforedue = comafterdue = 0.0
                else:
                    lefttask = overdue = risktask = completedtask = combeforedue = comafterdue = 0.0
                dict = {}
                dict['totaltask'] = totaltask
                dict['todotask'] = lefttask
                dict['overdue'] = overdue
                dict['risktask'] = risktask
                dict['completed'] = completedtask
                dict['completedbeforedue'] = combeforedue
                dict['completedafterdue'] = comafterdue
                return Response(dict)

            else:

                totaltask = Delegation.objects.filter(~Q(status=2), user=request.user).count()
                if totaltask:
                    todotask = Delegation.objects.filter(status=1, user=request.user).count()

                    lefttask = todotask * 100 / totaltask
                    if totaltask:
                        overdue = Delegation.objects.filter(status=1, user=request.user,
                                                            due_date__lte=current_time).count() * 100 / todotask
                        risktask = Delegation.objects.filter(status=1, user=request.user, risk_date__lte=current_time,
                                                             due_date__gt=current_time).count() * 100 / todotask
                    else:
                        overdue = risktask = 0.0
                    completed = Delegation.objects.filter(status=0, user=request.user).count()
                    completedtask = completed * 100 / totaltask
                    if completed:
                        combeforedue = Delegation.objects.filter(status=0, user=request.user, due_date__gte=F(
                            'finish_date')).count() * 100 / completed
                        comafterdue = Delegation.objects.filter(status=0, user=request.user,
                                                                due_date__lt=F('finish_date')).count() * 100 / completed
                    else:
                        combeforedue = comafterdue = 0.0
                else:
                    lefttask = overdue = risktask = completedtask = combeforedue = comafterdue = 0.0
                dict = {}
                dict['totaltask'] = totaltask
                dict['todotask'] = lefttask
                dict['overdue'] = overdue
                dict['risktask'] = risktask
                dict['completed'] = completedtask
                dict['completedbeforedue'] = combeforedue
                dict['completedafterdue'] = comafterdue
                return Response(dict)
        elif user == 'all':
            totaltask = Delegation.objects.filter(~Q(status=2)).count()
            if totaltask:

                todotask = Delegation.objects.filter(status=1).count()
                lefttask = todotask * 100 / totaltask

                if todotask:
                    overdue = Delegation.objects.filter(status=1, due_date__lte=current_time).count() * 100 / todotask
                    risktask = Delegation.objects.filter(status=1, risk_date__lte=current_time,
                                                         due_date__gt=current_time).count() * 100 / todotask
                else:
                    overdue = risktask = 0.0
                completed = Delegation.objects.filter(status=0).count()
                completedtask = completed * 100 / totaltask
                if completed:
                    combeforedue = Delegation.objects.filter(status=0,
                                                             due_date__gte=F('finish_date')).count() * 100 / completed
                    comafterdue = Delegation.objects.filter(status=0,
                                                            due_date__lt=F('finish_date')).count() * 100 / completed
                else:
                    combeforedue = comafterdue = 0.0
            else:
                lefttask = overdue = risktask = completedtask = combeforedue = comafterdue = 0.0
            dict = {}
            dict['totaltask'] = totaltask
            dict['todotask'] = lefttask
            dict['overdue'] = overdue
            dict['risktask'] = risktask
            dict['completed'] = completedtask
            dict['completedbeforedue'] = combeforedue
            dict['completedafterdue'] = comafterdue
            return Response(dict)
        else:

            totaltask = Delegation.objects.filter(~Q(status=2), user_id=user).count()
            if totaltask:
                todotask = Delegation.objects.filter(status=1, user_id=user).count()
                lefttask = todotask * 100 / totaltask
                if todotask:
                    overdue = Delegation.objects.filter(status=1, user_id=user,
                                                        due_date__gt=current_time).count() * 100 / todotask
                    overdue = Delegation.objects.filter(status=1, user_id=user,
                                                        due_date__lte=current_time).count() * 100 / todotask
                    risktask = Delegation.objects.filter(status=1, user_id=user, risk_date__lte=current_time,
                                                         due_date__gt=current_time).count() * 100 / todotask

                else:
                    overdue = risktask = 0.0
                completed = Delegation.objects.filter(status=0, user_id=user).count()
                completedtask = completed * 100 / totaltask

                if completed:
                    combeforedue = Delegation.objects.filter(status=0, user_id=user,
                                                             due_date__gte=F('finish_date')).count() * 100 / completed
                    comafterdue = Delegation.objects.filter(status=0, user_id=user,
                                                            due_date__lt=F('finish_date')).count() * 100 / completed
                else:
                    combeforedue = comafterdue = 0.0
            else:
                lefttask = overdue = risktask = completedtask = combeforedue = comafterdue = 0.0
            dict = {}
            dict['totaltask'] = totaltask
            dict['todotask'] = lefttask
            dict['overdue'] = overdue
            dict['risktask'] = risktask
            dict['completed'] = completedtask
            dict['completedbeforedue'] = combeforedue
            dict['completedafterdue'] = comafterdue

            return Response(dict)


class VariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = EForm
        fields = '__all__'


class CountViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        inbox_queryset = Delegation.objects.filter(user=self.request.user, status=1)
        completed_queryset = Delegation.objects.filter(user=self.request.user, status=0,
                                                       finish_date__year=timezone.now().year)
        completed_count = Delegation.objects.filter(user=self.request.user, status=0).count()
        overdue_count = inbox_queryset.filter(Q(due_date__lt=timezone.now()) & Q(risk_date__lt=timezone.now())).count()
        open_request_queryset = Delegation.objects.filter(user=self.request.user, status=2)
        query_count = AppQuery.objects.filter(user_to=self.request.user, is_answered=False).count()
        total = Delegation.objects.filter(user=self.request.user).count()
        if total != 0:
            open_request = (open_request_queryset.count() / total) * 100
            approve = Delegation.objects.filter(Q(user=self.request.user) & Q(status=0)
                                                & Q(additional_status__isnull=True)).count()
            approve_count = (approve / total) * 100
            reject = Delegation.objects.filter(Q(user=self.request.user) & Q(status=0) & Q(additional_status=0)).count()
            reject_count = (reject / total) * 100
            recheck = Delegation.objects.filter(Q(user=self.request.user) & Q(status=0) & Q(additional_status=1)).count()
            recheck_count = (recheck / total) * 100
            query = AppQuery.objects.filter(user_from=self.request.user).count()
            requested_query_count = (query / total) * 100
        else:
            open_request = 0
            approve_count = 0
            reject_count = 0
            recheck_count = 0
            requested_query_count = 0
        initiated = Application.objects.filter(init_user=self.request.user, created_at__year=timezone.now().year).count()
        x_axis = 'Initiated'
        if initiated == 0:
            x_axis = 'Inbox'
        if x_axis == 'Initiated':
            init_data = Application.objects.filter(init_user=self.request.user, created_at__year=timezone.now().year). \
                annotate(month=TruncMonth('created_at')).values('month'). \
                annotate(monthly_count=Count('id'))
        else:
            init_data = Delegation.objects.filter(user=self.request.user, init_date__year=timezone.now().year). \
                annotate(month=TruncMonth('init_date')).values('month'). \
                annotate(monthly_count=Count('id'))
        init_data_array = ["None"] * 12
        for exp in init_data:
            init_data_array[exp['month'].date().month - 1] = exp['monthly_count']
        completed_data = Delegation.objects.filter(user=self.request.user, status=0,
                                                   finish_date__year=timezone.now().year). \
            annotate(month=TruncMonth('finish_date')).values('month'). \
            annotate(monthly_count=Count('id'))
        complete_data = ["None"] * 12
        for exp in completed_data:
            complete_data[exp['month'].date().month - 1] = exp['monthly_count']
        w_risk = completed_queryset.filter(Q(risk_date__lte=timezone.now()) & Q(due_date__gt=timezone.now())). \
            annotate(month=TruncMonth('finish_date')).values('month'). \
            annotate(monthly_count=Count('id'))
        b_risk = completed_queryset.filter(Q(risk_date__gt=timezone.now()) & Q(due_date__gt=timezone.now())). \
            annotate(month=TruncMonth('finish_date')).values('month'). \
            annotate(monthly_count=Count('id'))
        o_risk = completed_queryset.filter(Q(due_date__lt=timezone.now()) & Q(risk_date__lt=timezone.now())). \
            annotate(month=TruncMonth('finish_date')).values('month'). \
            annotate(monthly_count=Count('id'))
        overdue_risk_array = ["None"] * 12
        within_risk_array = ["None"] * 12
        before_risk_array = ["None"] * 12
        for exp in w_risk:
            within_risk_array[exp['month'].date().month - 1] = exp['monthly_count']
        for exp in b_risk:
            before_risk_array[exp['month'].date().month - 1] = exp['monthly_count']
        for exp in o_risk:
            overdue_risk_array[exp['month'].date().month - 1] = exp['monthly_count']
        return Response({
            'pending': inbox_queryset.count(),
            'overdue': overdue_count,
            'completed': completed_count,
            'total': total,
            'query': query_count,
            'open_request': str(open_request) + '%',
            'approve_request': str(approve_count) + '%',
            'reject_request': str(reject_count) + '%',
            'query_request': str(requested_query_count) + '%',
            'recheck_request': str(recheck_count) + '%',
            'initiated_vs_completed': {
                'x_axis': x_axis,
                'graph_data': [
                    {
                        'name': x_axis,
                        'data': init_data_array
                    },
                    {
                        'name': 'Completed',
                        'data': complete_data
                    }
                ]
            },
            'histogram': [
                {
                    'name': 'Before Risk',
                    'data': before_risk_array
                },
                {
                    'name': 'Within Risk',
                    'data': within_risk_array
                },
                {
                    'name': 'Overdue Risk',
                    'data': overdue_risk_array
                }
            ]
        }, status=status.HTTP_201_CREATED)


class QueryVariableViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = [1, ]
    serializer_class = VariableSerializer
    model = EForm

    def list(self, request, *args, **kwargs):
        project_id = self.request.query_params.get('project', None)
        if project_id is None:
            return Response({'Detail: project_id required'})
        eform_content = self.model.objects.filter(project_id=project_id)
        variable_list = []
        for f in eform_content:
            if f.variables_id is not None:
                for elements in json.loads(f.variables_id):
                    elem_var = '@'+elements
                    if elem_var not in variable_list:
                        variable_list.append(elem_var)
        return Response(variable_list)


def get_eform_content(task, application, data=None):
    step = task.step
    single_step = step.get(position=1)
    if single_step.type == 0 and single_step.position == 1:
        if single_step.eform is None:
            return Response({'Detail': 'No eForm assigned.'})
        if single_step.eform.content == '' or single_step.eform.content is None:
            e_form = {}
        else:
            e_form = EFormPy(single_step.eform, application, data).generate_form()
        return e_form


class QueryInboxViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        query_id = self.request.query_params.get('query_id', None)
        delegation_id = self.request.query_params.get('delegation_id', None)
        if query_id is None and delegation_id is None:
            return Response({'Detail: query_id or delegation_id required'})
        if query_id is not None:
            try:
                specified_query = AppQuery.objects.get(pk=query_id)
            except AppQuery.DoesNotExist:
                return Response({'Detail: no query exists with this query_id'})
            obj_application = model_to_dict(specified_query.application)
            data_specified = EformHistory.objects.filter(delegation=specified_query.delegation).order_by(
                'delegation__id', '-pk').distinct('delegation__id').first()
            if data_specified is None:
                e_form = get_eform_content(specified_query.task, specified_query.application)
            else:
                e_form = get_eform_content(specified_query.task, specified_query.application, data_specified.data)

            return Response({
                'query_id': specified_query.id,
                'query': specified_query.query,
                'asked_by': specified_query.user_from.get_full_name(),
                'application': obj_application,
                'task': specified_query.task.name,
                'eform': e_form,
                'type': 'query_view'
            }, status=status.HTTP_201_CREATED)

        if delegation_id is not None:
            delegation_obj = Delegation.objects.get(pk=delegation_id)
            data_specified = EformHistory.objects.filter(delegation=delegation_obj).order_by('delegation__id',
                                                                                             '-pk').distinct(
                'delegation__id').first()
            if data_specified is None:
                e_form = get_eform_content(delegation_obj.task, delegation_obj.application)
            else:
                e_form = get_eform_content(delegation_obj.task, delegation_obj.application, data_specified.data)

            return Response({
                'application': model_to_dict(data_specified.delegation.application),
                'task': data_specified.delegation.task_id,
                'eform': e_form,
                'type': 'history_view'
            }, status=status.HTTP_201_CREATED)


class AppQuerySerializer(serializers.ModelSerializer):
    user_from_name = serializers.StringRelatedField(source='user_from.get_full_name')
    user_to_name = serializers.StringRelatedField(source='user_to.get_full_name')
    app_number = serializers.StringRelatedField(source='application.number')
    project_name = serializers.StringRelatedField(source='application.project.title')
    comment_count = serializers.SerializerMethodField()

    @staticmethod
    def get_comment_count(obj):
        return AppComment.objects.filter(application=obj.application.id).count()

    class Meta:
        model = AppQuery
        fields = '__all__'


def workflow_send_mail(identifier_query, appquery):
    if identifier_query == 'question':
        is_answer = False
        to_email = appquery.user_to.email
        to_user = appquery.user_to.get_full_name()
        next_user = appquery.user_from.get_full_name()
        subject_header = 'A new query has arrived'
        subject_body = 'Process Automation would like to kindly inform you that,' \
                       ' you have a new query regarding a task that you have already completed from'
    else:
        is_answer = True
        to_email = appquery.user_from.email
        to_user = appquery.user_from.get_full_name()
        next_user = appquery.user_to.get_full_name()
        subject_header = 'Query answer has arrived'
        subject_body = 'Process Automation would like to kindly inform you that,' \
                       'answer for your query has been submitted by'
    subject, from_email, to = subject_header, licensed.EMAIL_HOST_USER, to_email
    html_content = render_to_string('email/query_mail.html',
                                    {
                                        'email_body': subject_body,
                                        'user': to_user,
                                        'next_user': next_user,
                                        'init_date': appquery.date,
                                        'query_ques': appquery.query,
                                        'query_ans': appquery.query_answer,
                                        'answer_date': appquery.answer_date,
                                        'project_name': appquery.application.project.title,
                                        'app_number': appquery.application.number,
                                        'task_name': appquery.task.name,
                                        'query_answer': is_answer
                                    })
    try:
        send_mail(subject=subject, message='',
                  from_email=licensed.EMAIL_HOST_USER,
                  recipient_list=[to], html_message=html_content, fail_silently=True)
    except:
        pass


class AppMonitorSerializer(serializers.ModelSerializer):
    init_user_name = serializers.StringRelatedField(source='init_user.get_full_name')
    current_user_name = serializers.StringRelatedField(source='current_user.get_full_name')

    class Meta:
        model = Application
        fields = '__all__'


class AppMonitorViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppMonitorSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Application.objects.all()
    model = Application
    permission_id = [3, 25, 26 ]
    search_keywords = ['number', 'project__title']

    def list(self, request, *args, **kwargs):
        all = self.request.query_params.get('all', None)
        # monitor for admin. He has the authority to monitor every activity
        if all is not None and self.request.user.role.id == 1:
            queryset = self.queryset
        elif all is not None and self.request.user.role.id != 1:
            # monitor for roles with monitor permission
            queryset = self.model.objects.none()
            for p in self.request.user.role.permission.all():
                if p.id == 26:
                    queryset = self.queryset
                    break;
        else:
            # only assigned process monitor for general users
            projects = Task.objects.filter(user__id__in=[self.request.user.id])
            projects_array = []
            for p in projects:
                projects_array.append(p.project.id)
            queryset = self.queryset.filter(project__id__in=projects_array)

        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

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

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AppQueryViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppQuerySerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppQuery.objects.all()
    model = AppQuery
    permission_id = [3, 25, ]
    search_keywords = ['query', 'user_from__first_name',
                       'user_from__last_name', 'application__id']

    def list(self, request, *args, **kwargs):
        status = self.request.query_params.get('status', None)
        user_id = self.request.query_params.get('user_id', None)
        if status is None:
            raise serializers.ValidationError({'Detail: status required Ex: ?status=todo/query/overall_query'})
        if status == 'todo':
            if user_id is None:
                raise serializers.ValidationError({'Detail: no user_id given (?status=todo&user_id=1)'})
            else:
                to_user = User.objects.filter(pk=user_id)
                if to_user.exists():
                    queryset = self.queryset.filter(user_to=to_user, is_answered=False).order_by('-id')

                    search = self.request.query_params.get('search[value]', None)
                    column_id = self.request.query_params.get('order[0][column]', None)
                        # search
                    if search and search is not None and self.search_keywords is not None:
                        search_logic = []

                        for entity in self.search_keywords:
                            search_logic.append(Q(**{entity + '__icontains': search}))

                        queryset = queryset.filter(reduce(operator.or_, search_logic))

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

                    page = self.paginate_queryset(queryset)
                    if page is not None:
                        serializer = self.get_serializer(page, many=True)
                        return self.get_paginated_response(serializer.data)
                        # serializer = self.get_serializer(queryset, many=True)
                        # return Response(serializer.data)
                else:
                    raise serializers.ValidationError({'Detail: Invalid user id given'})
        elif status == 'query':
            task_id = self.request.query_params.get('task', None)
            application_id = self.request.query_params.get('application', None)
            if user_id is None:
                raise serializers.ValidationError({'Detail: no user_id given (?status=todo&user_id=1)'})
            if task_id is None:
                raise serializers.ValidationError({'Detail: no task id given'})
            if application_id is None:
                raise serializers.ValidationError({'Detail: no application id given'})
            from_user = User.objects.filter(pk=user_id)
            if not from_user.exists():
                raise serializers.ValidationError({'Detail: Invalid user id given'})
            application = Application.objects.filter(pk=application_id)
            if not application.exists():
                raise serializers.ValidationError({'Detail: No application exists with the provided application id'})
            task = Task.objects.filter(pk=task_id)
            if not task.exists():
                raise serializers.ValidationError({'Detail: No task exists with the provided task id'})
            queryset = self.queryset.filter(user_from=from_user, application=application, task=task).order_by('-id')
        elif status == 'overall_query':
            application_id = self.request.query_params.get('application', None)
            if application_id is None:
                raise serializers.ValidationError({'Detail: no application id given'})
            application = Application.objects.filter(pk=application_id)
            queryset = self.queryset.filter(application=application).order_by('-id')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        is_submit = request.data.get('is_submit', None)
        if is_submit is None or not is_submit:
            query = request.data.get('query', None)
            application = request.data.get('application', None)
            task = request.data.get('task', None)
            user_from = request.data.get('user_from', None)
            user_to = request.data.get('user_to', None)
            if query is None or not query:
                raise serializers.ValidationError({'detail': 'query required'})
            if application is None or not application:
                raise serializers.ValidationError({'detail': 'application required'})
            if task is None or not task:
                raise serializers.ValidationError({'detail': 'task required'})
            if user_from is None or not user_from:
                raise serializers.ValidationError({'detail': 'user_from required'})
            if user_to is None or not user_to:
                raise serializers.ValidationError({'detail': 'user_to required'})

            expiry_date = request.data.get('expiry_date', None)
            user_id, delegation_id = user_to.split(',')
            if expiry_date is not None:
                if "/" not in expiry_date:
                    raise serializers.ValidationError(
                        {'detail': 'Please provide a valid format of activation_date (yyyy/mm/dd)'})
                expiry_date = expiry_date.replace("/", "-")
                expiry_date_date = parse_date(expiry_date)
                app_query = self.model(query=query, user_from=User.objects.get(pk=user_from), user_to=User.objects.get(pk=user_id), delegation=Delegation.objects.get(pk=delegation_id),
                                       application=Application.objects.get(pk=application), task=Task.objects.get(pk=task), expiry_date=expiry_date_date)
            else:
                app_query = self.model(query=query, user_from=User.objects.get(pk=user_from), user_to=User.objects.get(pk=user_id),delegation=Delegation.objects.get(pk=delegation_id),
                                       application=Application.objects.get(pk=application), task=Task.objects.get(pk=task))
            app_query.save()
            workflow_send_mail('question', app_query)
            queryset = self.model.objects.filter(pk=app_query.pk)
            serializer = self.get_serializer(list(queryset), many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            if is_submit != "1":
                raise serializers.ValidationError({'detail': 'provide is_submit=1 for submitting a query answer'})
            else:
                query_id = request.data.get('query_id')
                query_answer = request.data.get('answer')
                if query_id is None or not query_id:
                    raise serializers.ValidationError({'detail': 'query_id required'})
                if query_answer is None or not query_answer:
                    raise serializers.ValidationError({'detail': 'answer required'})
                try:
                    specified_query = self.model.objects.get(pk=query_id)
                except self.model.DoesNotExist:
                    raise serializers.ValidationError({'detail': 'no query with query_id exists'})
                if specified_query.is_answered:
                    raise serializers.ValidationError({'detail': 'This query is already answered'})
                specified_query.query_answer = query_answer
                specified_query.is_answered = True
                specified_query.answer_date = datetime.now().date()
                specified_query.save()
                workflow_send_mail('answer', specified_query)
                return Response({'detail: Query answer submitted successfully'}, status=status.HTTP_201_CREATED)


class AppCommentSerializer(serializers.ModelSerializer):
    task_name = serializers.ReadOnlyField(source='task.name')
    application_number = serializers.ReadOnlyField(source='application.number')
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = AppComment
        fields = ['id', 'user', 'application', 'task', 'comment', 'date', 'task_name', 'application_number',
                  'user_name']


class AppCommentView(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppCommentSerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppComment.objects.all()
    model = AppComment
    model = AppComment
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        app_id = self.request.query_params.get('app_id')

        if app_id is None:
            queryset = self.queryset.all()
        else:
            queryset = self.queryset.filter(application=app_id).order_by('date')
            app = Application.objects.filter(id=app_id)

            if not app.count():
                raise serializers.ValidationError("Please provide correct Application ID")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class DelegationReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delegation
        fields = '__all__'


class DelegationReportViewset(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = DelegationSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Delegation.objects.all()
    http_method_names = ['get']
    model = Delegation
    search_keywords = ['application__number', 'project__title', 'task__name', 'process', 'user__first_name']
    change_keys = {
        'app_id': 'application__id',
        'app_number': 'application__number',
        'project_name': 'project__title',
        'task_name': 'task__name',
        'priority': 'task__priority',
        'user': 'first_name',
        # 'due_date': 'task__init_date',
    }
    permission_id = [3, 25, ]

    def list(self, request, *args, **kwargs):
        operation = self.request.query_params.get('operation', None)
        user = self.request.query_params.get('user', None)
        wf_status = self.request.query_params.get('status', None)
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))
        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(init_date__range=[date_from, date_to])
        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        if operation is not None and user is not None:
            if operation == "activity":
                queryset = queryset.filter(user_id=user)
                # data = self.get_serializer(queryset, many=True)
            else:
                queryset = []
        if operation is not None and wf_status is not None:
            if operation == "activity":
                queryset = queryset.filter(status=wf_status)
                # data = self.get_serializer(queryset, many=True)
            else:
                queryset = []
        else:
            queryset = queryset.filter()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ReassignmentSerializer(serializers.ModelSerializer):
    task_name = serializers.StringRelatedField(source='task.name')
    task = serializers.StringRelatedField(source='task.id')
    task_element_id = serializers.StringRelatedField(source='task.element_id')
    project_category = serializers.StringRelatedField(source='project.category.name')
    project_name = serializers.StringRelatedField(source='project.title')
    app_id = serializers.StringRelatedField(source='application.id')
    app_number = serializers.StringRelatedField(source='application.number')
    user = serializers.StringRelatedField(source='user.get_full_name')
    sent_by = serializers.StringRelatedField(source='sent_by.get_full_name')

    class Meta:
        model = Delegation
        fields = '__all__'


class ReassignmentViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ReassignmentSerializer
    pagination_class = LargeResultsSetPagination
    model = Delegation
    search_keywords = ['application__number', 'project__title', 'task__name', 'process', 'user__first_name']
    change_keys = {
        'app_id': 'application__id',
        'app_number': 'application__number',
        'project_name': 'project__title',
        'task_name': 'task__name',
        'priority': 'task__priority',
        'user': 'first_name',
        # 'due_date': 'task__init_date',
    }
    permission_id = [2, ]

    def update(self, request, *args, **kwargs):
        instance = new_instance = self.get_object()

        if not request.data.get('user'):
            raise serializers.ValidationError({'detail': 'You must provide a user id'})

        try:
            user = User.objects.get(pk=request.data.get('user'))
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'User with this pk was not found'})

        try:
            instance.task.user.get(pk=request.data.get('user'))
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Please assign this user to the task.'})

        partial = kwargs.pop('partial', False)
        instance.save()
        instance.status = 4
        instance.save()
        new_instance.pk = None
        new_instance.user = user
        new_instance.status = 1
        new_instance.save()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # refresh the instance from the database.
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        pass

    def create(self, request, *args, **kwargs):
        pass

    def retrieve(self, request, *args, **kwargs):
        pass

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter(project__supervisors=self.request.user, status=1)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class WeekendSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        many = kwargs.pop('many', True)
        super(WeekendSerializer, self).__init__(many=many, *args, **kwargs)

    class Meta:
        model = Weekend
        fields = '__all__'


class WeekendViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = WeekendSerializer
    model = Weekend
    search_keywords = []
    permission_id = [23, ]
    http_method_names = ['get', 'post']

    def create(self, request, *args, **kwargs):
        data = [dict(t) for t in set(tuple(item.items()) for item in request.data)]
        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        Weekend.objects.all().delete()
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'


class HolidayViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = HolidaySerializer
    pagination_class = LargeResultsSetPagination
    model = Holiday
    search_keywords = ['description']
    permission_id = [23, ]
    http_method_names = ['get', 'post', 'delete']
