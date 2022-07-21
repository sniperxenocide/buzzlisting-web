import operator
import re
from collections import OrderedDict
from functools import reduce
from django.utils.dateparse import parse_date
from datetime import datetime
from django.db.models import Q, Count
from django.forms import model_to_dict
from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response
from rest_framework.validators import UniqueValidator
from rest_framework.compat import set_many
from rest_framework.serializers import raise_errors_on_nested_writes
from rest_framework.utils import model_meta
from datetime import datetime, timedelta
from apps.core.admin.views import get_ip_address
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.api.validators import UniqueNameValidator
from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.buzzlisting.token import account_activation_token
from apps.core.rbac.models import User, Role, Permission, Group, UserDelegate, Freehold, Condo, Commercial, AppUser, AppViewReport, HouseLocation, Favourites, ContactRequest, MenuItems, LicenseText, PropertyViewReport, EmailText
from oauth2_provider.models import AccessToken
from apps.core.loginReport.models import LoginReport
from apps.dms.api.dms_activity.models import DmsActivity
from django.utils.datastructures import MultiValueDictKeyError
from django.utils import timezone
from rest_framework import viewsets
from django.contrib.auth import login, authenticate
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import send_mail
from conf import settings , licensed
from django.http import HttpResponse
from django.shortcuts import render_to_response
import requests
from geopy.distance import vincenty
from smtplib import SMTPException

class AuditTrail:
    def __init__(self, current_user, user_info, remote_addr, operation, operation_name):
        self.current_user = current_user
        self.user_info = user_info
        self.remote_addr = remote_addr
        self.operation = operation
        self.operation_name = operation_name

    def add_audit(self):
        user_id = self.current_user.id
        user_name = self.user_info.get_full_name()
        ip = self.remote_addr
        activity_time = timezone.now()
        operation = self.operation
        description = "User: '" + user_name + "' has been " + self.operation_name + \
                      " with Role: '" + self.user_info.role.name + "'"
        DmsActivity(user_id=user_id, operation=operation, ip=ip, description=description,
                    activity_time=activity_time).save()


class DelegateSerializer(serializers.ModelSerializer):
    user_in_action_name = serializers.StringRelatedField(source='present_user.get_full_name')
    user_in_action_id = serializers.StringRelatedField(source='present_user.pk')

    class Meta:
        model = UserDelegate
        fields = ['id', 'user_in_action_name', 'user_in_action_id', 'start_date', 'end_date']


class DelegateViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = DelegateSerializer
    model = UserDelegate
    permission_id = [3, 25, ]

    def create(self, request, *args, **kwargs):
        if request.data.get('is_edit') is None or not request.data.get('is_edit'):
            raise serializers.ValidationError({'detail': 'Please indicate if it is an edit or create delegatee'})
        else:
            isEdit = request.data.get('is_edit')
            if isEdit == "1":
                delegation_id = self.request.data.get('delegation_id')
                if delegation_id is None or not delegation_id:
                    raise serializers.ValidationError({'detail': 'You must provide a delegation_id for edit operation'})
                detail = self.model.objects.get(pk=delegation_id)
                if detail.is_active == 0:
                    raise serializers.ValidationError({'detail': 'This delegation id is already expired. '
                                                                 'you cannot edit this id'})
                from_user = detail.absent_user
                to_user = User.objects.get(pk=self.request.data.get('to_duty', detail.present_user.pk))
                start_date = self.request.data.get('activation_date', None)
                end_date = self.request.data.get('expiry_date', None)
                if start_date is None:
                    start_date_date = detail.start_date
                else:
                    start_date = start_date.replace("/", "-")
                    start_date_date = parse_date(start_date)
                if end_date is None:
                    end_date_date = detail.end_date
                else:
                    end_date = end_date.replace("/", "-")
                    end_date_date = parse_date(end_date)
                if end_date_date < start_date_date:
                    raise serializers.ValidationError(
                        {'detail': 'Invalid Expiry date'})
                if detail.present_user == to_user and detail.start_date == start_date_date and detail.end_date == end_date_date:
                    raise serializers.ValidationError({'detail': 'No new information to edit'})
                detail.is_active = 0
                detail.save()
            else:
                if request.data.get('from_duty') is None or not request.data.get('from_duty'):
                    raise serializers.ValidationError({'detail': 'Please provide the from_duty user id.'})

                if request.data.get('to_duty') is None or not request.data.get('to_duty'):
                    raise serializers.ValidationError({'detail': 'Please provide the to_duty user id.'})

                if request.data.get('activation_date') is None or not request.data.get('activation_date'):
                    raise serializers.ValidationError({'detail': 'Please provide the activation_date.'})

                if request.data.get('expiry_date') is None or not request.data.get('expiry_date'):
                    raise serializers.ValidationError({'detail': 'Please provide the expiry_date.'})
                try:
                    from_user = User.objects.get(pk=request.data.get('from_duty'))
                except User.DoesNotExist:
                    raise serializers.ValidationError({'detail': 'No user with from_duty user id exists'})
                try:
                    to_user = User.objects.get(pk=request.data.get('to_duty'))
                except User.DoesNotExist:
                    raise serializers.ValidationError({'detail': 'No user with to_duty user id exists'})
                start_date = request.data.get('activation_date')
                if "/" not in start_date:
                    raise serializers.ValidationError({'detail': 'Please provide a valid format of activation_date (yyyy/mm/dd)'})
                start_date = start_date.replace("/", "-")
                start_date_date = parse_date(start_date)
                end_date = request.data.get('expiry_date')
                if "/" not in end_date:
                    raise serializers.ValidationError({'detail': 'Please provide a valid format of expiry_date (yyyy/mm/dd)'})
                end_date = end_date.replace("/", "-")
                end_date_date = parse_date(end_date)
                already_assigned = self.model.objects.filter(absent_user=from_user, is_active=1).order_by('-id')[:1]
                if already_assigned.exists():
                    raise serializers.ValidationError({'detail': 'You have already one delegatee assigned.'})
                else:
                    if end_date_date < start_date_date:
                        raise serializers.ValidationError({'detail': 'Invalid Expiry date'})
        if datetime.now().date() < start_date_date:
            is_active = -1
        else:
            is_active = 1
        added_delegatee = self.model(is_active=is_active, absent_user=from_user, present_user=to_user,
                                     start_date=start_date_date, end_date=end_date_date)
        added_delegatee.save()
        queryset = self.model.objects.filter(pk=added_delegatee.pk)
        serializer = self.get_serializer(list(queryset), many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        user_id = self.request.query_params.get('user_id')
        if user_id and user_id is not None:
            queryset = self.model.objects.filter(~Q(is_active=0), absent_user__pk=user_id).order_by('-id')[:1]
            to_be_deleted = []
            for q in queryset:
                if q.is_expired:
                    q.is_active = 0
                    q.save()
                    to_be_deleted.append(q.id)
                if q.is_active:
                    q.is_active = 1
                    q.save()
            if len(to_be_deleted):
                queryset.filter(id__in=to_be_deleted).delete()
            serializer = self.get_serializer(list(queryset), many=True)
            return Response(serializer.data)
        else:
            return Response({'detail': 'You must provide a user_id for delegation query'},
                            status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            delete_instance = self.model.objects.get(pk=kwargs['pk'])
        except self.model.DoesNotExist:
            raise serializers.ValidationError({'detail': 'No row found with this id'})
        if delete_instance.is_active == 0:
            raise serializers.ValidationError({'detail': 'This delegation id is already expired. '
                                                         'you cannot delete this id'})
        delete_instance.is_active = 0
        delete_instance.save()
        return Response({'detail': 'Your Delegatee has been deleted successfully.'}, status=status.HTTP_200_OK)


class DelegateUserSerializer(serializers.ModelSerializer):
    name = serializers.StringRelatedField(source='get_full_name')
    id = serializers.StringRelatedField(source='pk')

    class Meta:
        model = User
        fields = ['name', 'id']


class UserSerializer(serializers.ModelSerializer):
    slug_regex = re.compile(r'^[-a-zA-Z0-9_.]{4,50}$')

    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())], required=True)
    username = serializers.RegexField(validators=[UniqueNameValidator(queryset=User.objects.all(), lookup='iexact')],
                                      regex=slug_regex,
                                      error_messages={
                                          'invalid': 'Username can contain alphanumeric, underscore and period(.). '
                                                     'Length: 4 to 50'
                                      })
    is_active = serializers.BooleanField(default=True)
    role_name = serializers.ReadOnlyField(source='role.name')
    group = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        exclude = ['user_permissions', 'is_superuser', 'groups']
        read_only_fields = ('id', 'date_joined')
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        operation = "Create User"
        operation_name = "Created"
        x_forwarded_for = self.context['request'].META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.context['request'].META.get('REMOTE_ADDR')
        AuditTrail(self.context['request'].user, user, ip_address,
                   operation, operation_name).add_audit()
        return user

    def update(self, instance, validated_data):
        skip_list = ['is_active', 'is_superuser', 'position',
                     'status', 'replaced_by', 'expiry_date', 'role_id']
        for attr, value in validated_data.items():
            if instance.id == 1 and attr in skip_list:
                continue
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()

        # Dms Activity
        description = "User: '" + instance.get_full_name() + "' has been Updated"
        x_forwarded_for = self.context['request'].META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.context['request'].META.get('REMOTE_ADDR')
        DmsActivity(user=self.context['request'].user, operation="Update User",
                    ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return instance


class UserViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = UserSerializer
    pagination_class = LargeResultsSetPagination
    model = User
    change_keys = {
        'role_name': 'role__name',
        'username': 'username',
    }
    search_keywords = ['username', 'first_name',
                       'last_name', 'email', 'role__name', 'status']
    permission_id = [1, 3, 25, ]

    def list(self, request, *args, **kwargs):
        user_id = self.request.query_params.get('user_id')
        if user_id and user_id is not None:
            self.serializer_class = DelegateUserSerializer
            queryset = self.model.objects.exclude(pk=user_id)
            serializer = self.get_serializer(list(queryset), many=True)

        else:
            queryset = self.model.objects.filter(role_id=1)
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == 1:
            return Response(OrderedDict([
                ('detail', 'Superuser deleting prohibited.')
            ]), status=status.HTTP_403_FORBIDDEN)

        # Audit Trail
        operation = "Delete User"
        description = "User: " + instance.get_full_name() + " has been Deleted"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoleSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(default=True)
    code = serializers.RegexField(required=True,
                                  regex=re.compile(r'^[a-zA-Z0-9_]+$'),
                                  validators=[UniqueValidator(queryset=Role.objects.all())])
    permission_name = serializers.StringRelatedField(
        source='permission', many=True, read_only=True)
    user_count = serializers.StringRelatedField(
        source='user.count', read_only=True)

    class Meta:
        model = Role
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at')


class RoleViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = RoleSerializer
    pagination_class = LargeResultsSetPagination
    model = Role
    change_keys = {
        'permission_name': 'permission__name',
        'user_count': 'user',
    }
    search_keywords = ['name']
    permission_id = [1, ]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Audit Trail
        permissions = serializer.data['permission_name']
        permission = ', '.join(permissions)
        description = "Role: '" + serializer.data['name'] + "' has been created with the permission of: " + permission
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Role Added", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if int(self.kwargs.get('pk')) == 1:
            return Response({
                'errors': 'You can not update the detail of this role.'
            }, status=404)

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        description = "Role: {} has been updated.".format(instance.name)

        DmsActivity(user=self.request.user, operation="Role Updated", ip=get_ip_address(request),
                    description=description, activity_time=timezone.now()).save()
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.id == 1:
            return Response({
                'errors': 'You can not delete this role.'
            }, 404)

        user = instance.user.count()

        if user > 0:
            return Response({
                'errors': 'This role has already {0} user(s).'.format(user)
            }, 404)

        # Audit Trail
        description = "Role: '" + instance.name + "' has been Deleted"
        DmsActivity(user=self.request.user, operation="Role Delete", ip=get_ip_address(request),
                    description=description, activity_time=timezone.now()).save()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter(pk=1)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []
            print(search)

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:

            column_name = self.request.query_params.get('columns[' + column_id + '][data]', None)
            print(column_name)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get('order[0][dir]') == 'desc' else ''
                if column_name == 'user_count':
                    print("ok")
                else:
                    queryset = queryset.order_by(order_dir + column_name).annotate(total=Count('user')).order_by(
                        order_dir + 'total')

        return queryset


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'


class PermissionViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = PermissionSerializer
    pagination_class = LargeResultsSetPagination
    model = Permission
    search_keywords = ['name']
    permission_id = [1, ]

    def get_queryset(self):
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.filter().order_by('name')

        return queryset


class GroupSerializer(serializers.ModelSerializer):
    slug_regex = re.compile(r'^[-a-zA-Z0-9_.\s]{2,100}$')

    name = serializers.RegexField(validators=[UniqueNameValidator(queryset=Group.objects.all(), lookup='iexact')],
                                  regex=slug_regex,
                                  error_messages={
                                      'invalid': 'Username can contain alphanumeric, underscore and period(.). '
                                                 'Length: 2 to 100'
                                  })

    user_detail = serializers.StringRelatedField(
        source='user', many=True, read_only=True)

    class Meta:
        model = Group
        fields = '__all__'


class GroupViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    model = Group
    serializer_class = GroupSerializer
    pagination_class = LargeResultsSetPagination
    change_keys = {
        'user_detail': 'user__username',
        'user': 'user',
    }
    search_keywords = ['name']
    permission_id = [1, ]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Audit Trail
        description = "Role: '" + serializer.data['name'] + "' has been Created"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Group Create", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # refresh the instance from the database.
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        # Audit Trail
        users = serializer.data['user_detail']
        user = ','.join(users)
        status = "Active" if serializer.data['status'] is True else "Inactive"
        description = "Group: '" + instance.name + "' has been Updated where users are: " + \
                      user + " and Status: " + status
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Group Update", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user.count()

        if user > 0:
            return Response({
                'errors': 'This group has already {0} user(s).'.format(user)
            }, 404)
        self.perform_destroy(instance)

        # Audit Trail
        description = "Group: '" + instance.name + "' has been Deleted"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Group Delete", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

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

                if column_name == 'user':
                    queryset = queryset.order_by(order_dir + column_name).annotate(total=Count('user')).order_by(
                        order_dir + 'total')
                else:
                    queryset = queryset.order_by(order_dir + column_name)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        return queryset


class FreeholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Freehold
        fields = '__all__'


class FreeholdViewSet(CustomViewSetForQuerySet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = FreeholdSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Freehold.objects.all()
    permission_id = [25, ]
    model = Freehold
    search_keywords = ['Address', 'MLSNumber']

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

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

        #page
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class FreeholdCount(viewsets.ModelViewSet):
    serializer_class = FreeholdSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = Freehold.objects.all().count()
        return Response(result)


class CondoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condo
        fields = '__all__'


class CondoViewSet(CustomViewSetForQuerySet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = CondoSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Condo.objects.all()
    permission_id = [25, ]
    model = Condo
    search_keywords = ['Address', 'MLSNumber']

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

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

        # page
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CondoCount(viewsets.ModelViewSet):
    serializer_class = CondoSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = Condo.objects.all().count()
        return Response(result)

class CommercialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commercial
        fields = '__all__'


class CommercialViewSet(CustomViewSetForQuerySet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = CommercialSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Condo.objects.all()
    permission_id = [25, ]
    model = Commercial
    search_keywords = ['Address', 'MLSNumber']

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

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
        # page
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CommercialCount(viewsets.ModelViewSet):
    serializer_class = CommercialSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = Commercial.objects.all().count()
        return Response(result)



class AppUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = '__all__'


class RegisteredUserCount(viewsets.ModelViewSet):
    serializer_class = AppUserSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = AppUser.objects.filter(registration=1, registered_at__lte=datetime.today(),
                           registered_at__gt=datetime.today() - timedelta(days=30)).count()
        return Response(result)


class UnregisteredUserCount(viewsets.ModelViewSet):
    serializer_class = AppUserSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = AppUser.objects.filter(registration=2, registered_at__lte=datetime.today(),
                           registered_at__gt=datetime.today() - timedelta(days=30)).count()
        return Response(result)


class AppUserViewset(viewsets.ModelViewSet):
        # permission_classes = [GreenOfficeApiBasePermission]
        serializer_class = AppUserSerializer
        pagination_class = LargeResultsSetPagination
        queryset = AppUser.objects.filter(registered_at__lte=datetime.today(),
                           registered_at__gt=datetime.today() - timedelta(days=30))
        permission_id = [25, ]
        model = AppUser
        http_method_names = ['get']
        search_keywords = ['emailPhone',]

        def list(self, request, *args, **kwargs):
            accesstoken = self.request.query_params.get('token')
            signup = self.request.query_params.get('signup')
            signin = self.request.query_params.get('signin')
            source = self.request.query_params.get('source')
            email = self.request.query_params.get('email')
            uidb64 = self.request.query_params.get('uidb64')
            username = self.request.query_params.get('username')
            password = self.request.query_params.get('password')
            activation = self.request.query_params.get('activation')
            print(activation)

            if source == 'email':
                if signin == 'Y':
                    try:
                        tryAppUser = AppUser.objects.get(username=username)
                        return Response('user is registered')
                    except AppUser.DoesNotExist:
                        return Response('user is not registered')

                if signup == 'Y':
                    try:
                        tryUser = User.objects.get(email=email)
                        return Response("user already exists with this mail")
                    except User.DoesNotExist:
                        try:
                            try2User = AppUser.objects.get(username=username)
                            return Response("user already exists with this username")
                        except AppUser.DoesNotExist:
                            try:
                                try3User = User.objects.get(username=username)
                                return Response("user already exists with this username")
                            except User.DoesNotExist:
                                newUser = User(username=username, email=email, status='0')
                                newUser.set_password(password)
                                newUser.save()
                                # AppUser(username=username, emailPhone=email, registration=1, source=2)
                                print("signup from app")

                                email_text = EmailText.objects.get(pk=1).text
                                message = render_to_string('core/buzzlisting/activeEmail.html', {
                                    'user': newUser,
                                    'text' : email_text,
                                    'domain': licensed.APP_HOST+'/api/v1/appUser/?source=email&activation=Y&uidb64=' + str(
                                        newUser.pk) + '&token=' + str(account_activation_token.make_token(newUser)),
                                })


                                subject = 'Activate BUZZLISTING account'
                                toMail = []
                                toMail.append(newUser.email)
                                #toMail.append('adnan@infosapex.com')
                                print("host email: ", licensed.EMAIL_HOST_USER)
                                send_mail(subject=subject, message=email_text,
                                          from_email=licensed.EMAIL_HOST_USER,
                                          recipient_list=toMail,
                                          html_message=message,
                                          fail_silently=False)
                                return Response('confirm mail')
                elif activation =='Y':
                    print("activation from email")
                    print("Inside activation")
                    try:
                        uid = int(uidb64)
                        user = User.objects.get(pk=uid)
                    except(TypeError, ValueError, OverflowError, User.DoesNotExist):
                        user = None
                    if user is not None and account_activation_token.check_token(user, accesstoken):
                        user.status = '1'
                        user.save()
                        newAppuser = AppUser(username=user.username, password=user.password, emailPhone=user.email, registration=1, source=2)
                        newAppuser.save()
                        # login(request, user)
                        # return redirect('home')
                        return render_to_response('core/buzzlisting/landingMail.html')
                    else:
                        return HttpResponse('Activation link is invalid!')


            if accesstoken is not None:
                data = requests.get("https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,age_range,link&access_token="+ accesstoken)
                dataDict=data.json()
                try:
                    Email = dataDict["email"]
                    username = dataDict["first_name"]+"."+dataDict["last_name"]+dataDict["id"]
                    registration = 1
                except Exception as e:
                    return Response("Access Token not found")
                try:
                    appuser = AppUser.objects.get(emailPhone=Email)
                    if appuser.registration ==2:
                        return Response("unregistered fb user")
                except AppUser.DoesNotExist:
                    newAppsuer= AppUser(username=username, emailPhone=Email, registration=registration, source=1)
                    newAppsuer.save()
                return Response("facebook Ok")



class AppUserListViewset(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppUserSerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppUser.objects.all()
    permission_id = [1]
    model = AppUser
    search_keywords = ['emailPhone', 'username',]

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
                queryset = queryset.filter(registered_at__range=[date_from, date_to])

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


class UnregisterAppUser(viewsets.ModelViewSet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppUserSerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppUser.objects.all()
    permission_id = [1, ]
    http_method_names = ['get']
    model = AppUser
    search_keywords = ['emailPhone', ]

    def list(self, request, *args, **kwargs):
        source = self.request.query_params.get('source')
        token = self.request.query_params.get('token')
        if source=='1':       #facebook
            if token is not None:
                data = requests.get(
                    "https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,age_range,link&access_token=" + token)
                dataDict = data.json()
                try:
                    username = ""
                    try:
                        username = dataDict["first_name"] + "." + dataDict["last_name"] + dataDict["id"]
                    except Exception as e:
                        return Response("invalid request")
                    tryAppUser = AppUser.objects.get(username=username)
                    tryAppUser.registration = 2
                    tryAppUser.unregistered_at = timezone.now()
                    tryAppUser.save()
                    return Response("user unregistered")
                except AppUser.DoesNotExist:
                    return Response("invalid request")
        elif source=='2':    #email
            if token is not None:
                try:
                    user = AccessToken.objects.get(token=token).user_id
                    username = User.objects.get(pk=user).username
                    tryAppUser = AppUser.objects.get(username=username)
                    tryAppUser.registration = 2
                    tryAppUser.unregistered_at = timezone.now()
                    tryAppUser.save()
                    return Response("user unregistered")
                except AccessToken.DoesNotExist:
                    return Response("invalid request")
        return Response("invalid request")


class CheckRegisteredUser(viewsets.ModelViewSet):
    serializer_class = AppUserSerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppUser.objects.all()
    permission_id = [1, ]
    model = AppUser
    http_method_names = ['get']
    search_keywords = ['emailPhone', ]

    def list(self, request, *args, **kwargs):
        email = self.request.query_params.get('email')
        source = self.request.query_params.get('source')
        uid = self.request.query_params.get('uid')
        token = self.request.query_params.get('token')
        password = self.request.query_params.get('pass')
        uidb64 = self.request.query_params.get('uidb64')
        if email:
            try:
                tryAppUser = AppUser.objects.get(emailPhone=email)
                tryUser = User.objects.get(username=tryAppUser.username)
                email_text = EmailText.objects.get(pk=1).text
                message = render_to_string('core/buzzlisting/forgetActivationEmail.html', {
                    'user': tryUser,
                    'text': email_text,
                    'domain': licensed.APP_HOST + '/api/v1/checkmail/?source=email&uidb64=' + str(
                        tryUser.pk) + '&token=' + str(account_activation_token.make_token(tryUser)),
                })

                subject = 'BUZZLISTING Password Reset Request'
                toMail = []
                toMail.append(tryUser.email)
                # toMail.append('adnan@infosapex.com')
                print("host email: ", licensed.EMAIL_HOST_USER)
                try:
                    send_mail(subject=subject, message=email_text,
                              from_email=licensed.EMAIL_HOST_USER,
                              recipient_list=toMail,
                              html_message=message,
                              fail_silently=False)
                    tryAppUser.password_reset_request = 1
                    tryAppUser.save()
                    return Response("user is valid")
                except SMTPException as e:
                    return Response("there was a problem sending the email")
            except AppUser.DoesNotExist:
                return Response("No such registered user")
        elif source == 'email':
            try:
                uid = int(uidb64)
                user = User.objects.get(pk=uid)
            except(TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None
            if user is not None and account_activation_token.check_token(user, token):
                tryAppUser = AppUser.objects.get(username=user.username)
                if tryAppUser.password_reset_request == 1:
                    return render_to_response('core/buzzlisting/resetPassword.html')
                else:
                    return Response("Invalid token")
        elif uid is not None:
            try:
                uid = int(uid)
                user = User.objects.get(pk=uid)
            except(TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None
            if user is not None and account_activation_token.check_token(user, token):
                tryAppUser = AppUser.objects.get(username=user.username)
                if tryAppUser.password_reset_request == 1:
                    user.set_password(password)
                    user.save()
                    tryAppUser.password_reset_request = 2
                    tryAppUser.password = user.password
                    tryAppUser.save()
                    return Response("Password reset done")
                else:
                    return Response("token_expried")
        else:
            return Response("Invalid request")


class logoutAppUser(viewsets.ModelViewSet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AppUserSerializer
    pagination_class = LargeResultsSetPagination
    queryset = AppUser.objects.all()
    permission_id = [1, ]
    model = AppUser
    http_method_names = ['get']
    search_keywords = ['emailPhone', ]

    def list(self, request, *args, **kwargs):
        source = self.request.query_params.get('source')
        token = self.request.query_params.get('token')
        if source =='1': ###facebook
            return Response('logout from fb')
        elif source =='2': ###email
            if token is not None:
                try:
                    accessToken = AccessToken.objects.get(token=token)
                    accessToken.expires = timezone.now()
                    accessToken.save()
                    return Response('logout from email')
                except AccessToken.DoesNotExist:
                    return Response("invalid request")

        return Response("invalid request")


class AppviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppViewReport
        fields = '__all__'


class AppViewCount(viewsets.ModelViewSet):
    serializer_class = AppUserSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        result = AppViewReport.objects.filter(viewed_at__lte=datetime.today(),
                           viewed_at__gt=datetime.today() - timedelta(days=30)).count()
        return Response(result)

class AppviewViewset(viewsets.ModelViewSet):
    serializer_class = AppviewSerializer
    pagination_class = LargeResultsSetPagination
    permission_id = [1, ]
    model = AppViewReport
    http_method_names = ['get']
    search_keywords = ['ip', ]

    def list(self, request, *args, **kwargs):
        username = self.request.query_params.get('username')
        lat = self.request.query_params.get('lat')
        long = self.request.query_params.get('long')
        ip = get_ip_address(request)
        if username is not None:
            try:
                appuser = AppUser.objects.get(username=username)
                AppViewReport(appuser=appuser,ip=ip, latitude=lat,longitude=long).save()
            except AppUser.DoesNotExist:
                AppViewReport(ip=ip, latitude=lat,longitude=long).save()
        else:
            AppViewReport(ip=ip, latitude=lat,longitude=long).save()
        return Response('welcome')


class PropertyViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyViewReport
        fields = '__all__'


# class AppViewCount(viewsets.ModelViewSet):
#     serializer_class = AppUserSerializer
#     http_method_names = ['get']
#
#     def list(self, request, *args, **kwargs):
#         result = AppViewReport.objects.filter(viewed_at__lte=datetime.today(),
#                            viewed_at__gt=datetime.today() - timedelta(days=30)).count()
#         return Response(result)

class PropertyviewViewset(viewsets.ModelViewSet):
    serializer_class = PropertyViewSerializer
    pagination_class = LargeResultsSetPagination
    permission_id = [1, ]
    model = PropertyViewReport
    http_method_names = ['get']
    search_keywords = ['ip', ]

    def list(self, request, *args, **kwargs):
        username = self.request.query_params.get('username')
        lat = self.request.query_params.get('lat')
        long = self.request.query_params.get('long')
        type = self.request.query_params.get('type')
        property_id = self.request.query_params.get('id')
        ip = get_ip_address(request)
        house = ''
        if type is not None and property_id is not None:
            if type == '1':
                house = HouseLocation.objects.get(freehold_id=property_id)
            elif type == '2':
                house = HouseLocation.objects.get(condo_id=property_id)
            elif type == '3':
                house = HouseLocation.objects.get(commercial_id=property_id)

        if username is not None and lat is not None and long is not None:
            try:
                appuser = AppUser.objects.get(username=username)
                PropertyViewReport(appuser=appuser,ip=ip, latitude=lat,longitude=long, house = house).save()
            except AppUser.DoesNotExist:
                PropertyViewReport(ip=ip, latitude=lat, longitude=long, house = house).save()
        elif lat is not None and long is not None:
            PropertyViewReport(ip=ip, latitude=lat, longitude=long, house = house).save()
        return Response('propertyView added')





class HouseLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseLocation
        fields = '__all__'


class HouseLocationViewSet(CustomViewSetForQuerySet):
    # permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = HouseLocationSerializer
    pagination_class = LargeResultsSetPagination
    queryset = HouseLocation.objects.all()
    permission_id = [1, ]
    model = HouseLocation
    http_method_names = ['get']
    search_keywords = []

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        lat = self.request.query_params.get('lat')
        long = self.request.query_params.get('long')

        salerent = self.request.query_params.get('sr')
        typeCheck = self.request.query_params.get('type')
        max = self.request.query_params.get('max')
        min = self.request.query_params.get('min')

        dataList = []
        if lat is not None and long is not None:
            current_pos = (lat, long)
            for aData in queryset:
                dataLat = aData.latitude
                dataLong = aData.longitude
                dataPoint = (dataLat, dataLong)
                distance = vincenty(current_pos, dataPoint).kilometers
                # print(distance)
                data = {}
                if distance <= .3:
                    data['id']= aData.id
                    data['latitude']= aData.latitude
                    data['longitude']=aData.longitude
                    data['type'] = aData.type
                    if(aData.type==1):
                        data['id'] = aData.freehold.id
                        data['mls#'] = aData.freehold.MLSNumber
                        data['salerent'] = aData.freehold.SaleLease
                        data['price'] = aData.freehold.ListPrice
                        data['address'] = aData.freehold.Address
                        data['municipality'] = aData.freehold.Municipality
                        data['area'] = aData.freehold.Area
                        data['sqfeet'] = aData.freehold.ApproxSquareFootage
                        data['bedrooms'] = aData.freehold.Bedrooms
                    elif(aData.type==2):
                        data['id'] = aData.condo.id
                        data['mls#'] = aData.condo.MLSNumber
                        data['salerent'] = aData.condo.SaleLease
                        data['price'] = aData.condo.ListPrice
                        data['address'] = aData.condo.Address
                        data['municipality'] = aData.condo.Municipality
                        data['area'] = aData.condo.Area
                        data['sqfeet'] = aData.condo.ApproxSquareFootage
                        data['bedrooms'] = aData.condo.Bedrooms
                    else:
                        data['id'] = aData.commercial.id
                        data['mls#'] = aData.commercial.MLSNumber
                        data['salerent'] = aData.commercial.SaleLease
                        data['price'] = aData.commercial.ListPrice
                        data['pricecode'] = aData.commercial.ListPriceCode
                        data['address'] = aData.commercial.Address
                        data['municipality'] = aData.commercial.Municipality
                        data['area'] = aData.commercial.Area
                        data['sqfeet'] = str(aData.commercial.TotalArea) + ' ' + str(aData.commercial.TotalAreaCode)
                        data['bedrooms'] = 'N/A'
                    print("DataType: ", typeCheck, " ", data['type'])
                    if min is not None and data['price'] < int(min): ##min range filtering
                        continue
                    elif max is not None and data['price'] > int(max): ##max range filtering
                        continue
                    elif salerent is not None and data['salerent']!=salerent: ##saleRent filtering
                        continue
                    elif typeCheck is not None and data['type']!=int(typeCheck): ##Property filtering
                        continue
                    else:
                        dataList.append(data)
                        print(data)
            # # page
            # page = self.paginate_queryset(queryset)
            # if page is not None:
            #     serializer = self.get_serializer(page, many=True)
            #     return self.get_paginated_response(serializer.data)
            #
            # serializer = self.get_serializer(queryset, many=True)
            res = {}
            res['data'] = dataList
            try:
                draw = self.request.query_params.get('draw')
            except MultiValueDictKeyError:
                draw = 1
            return Response(OrderedDict([
                ('recordsTotal', len(dataList)),
                ('recordsFiltered', len(dataList)),
                ('draw', draw),
                ('data', res['data'])
            ]))


class FavouriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favourites
        fields = '__all__'


class FavouriteList(CustomViewSetForQuerySet):
    serializer_class = FavouriteSerializer
    permission_id = [1, ]
    model = HouseLocation
    http_method_names = ['get']
    search_keywords = []

    def list(self, request, *args, **kwargs):
        username = self.request.query_params.get('username')
        dataList = []
        if username is not None:
            try:
                tryAppUser = AppUser.objects.filter(username=username)

                FavouriteItems = Favourites.objects.filter(appuser=tryAppUser)
                # print(FavouriteItems)
                for aFavouriteData in FavouriteItems:
                    aData=HouseLocation.objects.get(id=aFavouriteData.house_id)
                    # print("HouseLocationData: ",aData)
                    dataLat = aData.latitude
                    dataLong = aData.longitude

                    # print(distance)
                    data = {}

                    data['id'] = aData.id
                    data['latitude'] = aData.latitude
                    data['longitude'] = aData.longitude
                    data['type'] = aData.type
                    if (aData.type == 1):
                        data['id'] = aData.freehold.id
                        data['mls#'] = aData.freehold.MLSNumber
                        data['salerent'] = aData.freehold.SaleLease
                        data['price'] = aData.freehold.ListPrice
                        data['address'] = aData.freehold.Address
                        data['municipality'] = aData.freehold.Municipality
                        data['area'] = aData.freehold.Area
                    elif (aData.type == 2):
                        data['id'] = aData.condo.id
                        data['mls#'] = aData.condo.MLSNumber
                        data['salerent'] = aData.condo.SaleLease
                        data['price'] = aData.condo.ListPrice
                        data['address'] = aData.condo.Address
                        data['municipality'] = aData.condo.Municipality
                        data['area'] = aData.condo.Area
                    else:
                        data['id'] = aData.commercial.id
                        data['mls#'] = aData.commercial.MLSNumber
                        data['salerent'] = aData.commercial.SaleLease
                        data['price'] = aData.commercial.ListPrice
                        data['pricecode'] = aData.commercial.ListPriceCode
                        data['address'] = aData.commercial.Address
                        data['municipality'] = aData.commercial.Municipality
                        data['area'] = aData.commercial.Area
                    dataList.append(data)
                # # page
                # page = self.paginate_queryset(queryset)
                # if page is not None:
                #     serializer = self.get_serializer(page, many=True)
                #     return self.get_paginated_response(serializer.data)
                #
                # serializer = self.get_serializer(queryset, many=True)
                res = {}
                res['data'] = dataList
                try:
                    draw = self.request.query_params.get('draw')
                except MultiValueDictKeyError:
                    draw = 1
                return Response(OrderedDict([
                    ('recordsTotal', len(dataList)),
                    ('recordsFiltered', len(dataList)),
                    ('draw', draw),
                    ('data', res['data'])
                ]))
            except AppUser.DoesNotExist:
                return Response("no such user")
        else:
            return Response("Invalid link")



class FavouriteEntryDelete(viewsets.ModelViewSet):
    serializer_class = FavouriteSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        operation = self.request.query_params.get('op')
        type = self.request.query_params.get('type')
        property_id = self.request.query_params.get('id')
        username = self.request.query_params.get('username')
        if operation =='en':
            house = ''
            if type == '1':
                house = HouseLocation.objects.get(freehold_id=property_id)
            elif type == '2':
                house = HouseLocation.objects.get(condo_id=property_id)
            elif type == '3':
                house = HouseLocation.objects.get(commercial_id=property_id)
            try:
                tryAppUser = AppUser.objects.get(username=username)
                try:
                    tryFav = Favourites.objects.get(house=house, appuser=tryAppUser)
                    return Response('favourite item already exits')
                except Favourites.DoesNotExist:
                    newFav = Favourites(house=house)
                    newFav.appuser = AppUser.objects.get(username=username)
                    newFav.save()
                    return Response('favourite item added')
            except AppUser.DoesNotExist:
                return Response('no such user')

        elif operation =='del':
            house = ''
            if type == '1':
                house = HouseLocation.objects.get(freehold_id=property_id)
            elif type == '2':
                house = HouseLocation.objects.get(condo_id=property_id)
            elif type == '3':
                house = HouseLocation.objects.get(commercial_id=property_id)
            try:
                oldFav = Favourites.objects.get(house=house,appuser__username=username)
                oldFav.delete()
                return Response('favourite item deleted')
            except Favourites.DoesNotExist:
                return Response('favourite item not found')


class ContactRequestSerializer(serializers.ModelSerializer):
    email_obj = serializers.StringRelatedField(source="appuser.emailPhone")
    type_obj = serializers.StringRelatedField(source='house.type')
    freehold_address_obj = serializers.StringRelatedField(source='house.freehold.Address')
    condo_address_obj = serializers.StringRelatedField(source='house.condo.Address')
    commercial_address_obj = serializers.StringRelatedField(source='house.commercial.Address')
    freehold_brokerage_obj = serializers.StringRelatedField(source='house.freehold.ListBrokerage')
    condo_brokerage_obj = serializers.StringRelatedField(source='house.condo.ListBrokerage')
    commercial_brokerage_obj = serializers.StringRelatedField(source='house.commercial.ListBrokerage')
    freehold_price_obj = serializers.StringRelatedField(source="house.freehold.ListPrice")
    condo_price_obj = serializers.StringRelatedField(source="house.condo.ListPrice")
    commercial_price_obj = serializers.StringRelatedField(source="house.commercial.ListPrice")
    commercial_pricecode_obj = serializers.StringRelatedField(source="house.commercial.ListPriceCode")
    # print("Type Checking: ", type_obj)
    class Meta:
        model = ContactRequest
        fields = '__all__'

        def update(self, instance, validated_data):
            raise_errors_on_nested_writes('update', self, validated_data)
            info = model_meta.get_field_info(instance)

            for attr, value in validated_data.items():
                if attr in info.relations and info.relations[attr].to_many:
                    set_many(instance, attr, value)
                else:
                    setattr(instance, attr, value)
            instance.save()
            # self.perform_action(instance, model_to_dict(instance), update=True)
            return instance

class UnresolvedEntry(viewsets.ModelViewSet):
    serializer_class = ContactRequestSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        type = self.request.query_params.get('type')
        property_id = self.request.query_params.get('id')
        username = self.request.query_params.get('username')
        anonymous = self.request.query_params.get('anonymous')
        email = self.request.query_params.get('email')
        phone = self.request.query_params.get('phone')
        msg = self.request.query_params.get('msg')
        if type is None or property_id is None:
            return Response('invalid request')
        house = ''
        if type == '1':
            house = HouseLocation.objects.get(freehold_id=property_id)
        elif type == '2':
            house = HouseLocation.objects.get(condo_id=property_id)
        elif type == '3':
            house = HouseLocation.objects.get(commercial_id=property_id)
        appuser = ''
        try:
            appuser = AppUser.objects.get(username=username)
        except AppUser.DoesNotExist:
            if anonymous == 'Y':
                newReq = ContactRequest(house=house, phone=phone, msg=msg, email=email, status=2, source='anonymous')
                newReq.save()
                return Response('contact request added')
            return Response('no such user')
        newReq = ContactRequest(house=house, appuser=appuser, status=2, source='appuser')
        newReq.save()
        return Response('contact request added')



class UnresolvedContactRequestList(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ContactRequestSerializer
    pagination_class = LargeResultsSetPagination
    queryset = ContactRequest.objects.all()
    permission_id = [25]
    model = ContactRequest
    search_keywords = []

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.filter(status=2)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(created_date__range=[date_from, date_to])

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


class ResolvedContactRequestList(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = ContactRequestSerializer
    pagination_class = LargeResultsSetPagination
    queryset = ContactRequest.objects.all()
    permission_id = [25]
    model = ContactRequest
    search_keywords = []

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.filter(status=1)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(modified_date__range=[date_from, date_to])

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


class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItems
        fields = '__all__'


class MenuList(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = MenuSerializer
    pagination_class = LargeResultsSetPagination
    queryset = MenuItems.objects.all()
    permission_id = [25]
    model = MenuItems
    search_keywords = []

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # # dateRange search
        # if date_from and date_from is not None:
        #     if date_to and date_to is not None:
        #         queryset = queryset.filter(modified_date__range=[date_from, date_to])

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


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicenseText
        fields = '__all__'


class Terms(viewsets.ModelViewSet):
    serializer_class = LicenseSerializer
    pagination_class = LargeResultsSetPagination
    queryset = LicenseText.objects.all()
    permission_id = [25, ]
    model = LicenseText
    search_keywords = []

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()

        # page
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)



class EmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailText
        fields = '__all__'


class EmailContent(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = EmailSerializer
    pagination_class = LargeResultsSetPagination
    queryset = EmailText.objects.all()
    permission_id = [25]
    model = EmailText
    search_keywords = []

    def list(self, request, *args, **kwargs):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.all()
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic)).distinct()

        # page
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)