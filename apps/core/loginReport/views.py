import operator
from functools import reduce

from django.db.models import Q
from django.core import serializers as ds
from rest_framework import permissions
from rest_framework import serializers, viewsets

from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.api.Pagination import LargeResultsSetPagination
from datetime import datetime, timedelta

from django.contrib.sessions.models import Session

from apps.core.rbac.models import User
from apps.core.loginReport.models import LoginReport


class LoginReportSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(source='user.get_full_name')
    status_info = serializers.SerializerMethodField('getStatus')

    def getStatus(self, obj):
        uid_arr = []

        session_key_arr = Session.objects.only('session_key')

        for key in session_key_arr:
            # uid_arr.append(int(Session.objects.get(session_key=key).get_decoded().get('_auth_user_id')))
            uid_arr.append(Session.objects.get(session_key=key).get_decoded().get('_auth_user_id'))
        d = dict()
        # print(type(str(obj.user.id)))
        d['status'] = 'true' if str(obj.user.id) in uid_arr else 'false'
        return d

    class Meta:
        model = LoginReport
        fields = '__all__'


class LoginReportViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = LoginReportSerializer
    pagination_class = LargeResultsSetPagination
    model = LoginReport
    search_keywords = ['user__username']
    permission_id = [21, ]

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        queryset = self.model.objects.filter(login__lte=datetime.today(),
                           login__gt=datetime.today() - timedelta(days=30))
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(login__range=[date_from, date_to])

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
