import operator
from functools import reduce

from django.db.models import Q
from rest_framework import permissions
from rest_framework import serializers, viewsets

from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.api.Pagination import LargeResultsSetPagination

from django.contrib.sessions.models import Session

from apps.core.rbac.models import User
from apps.core.rbac.views import UserSerializer
from apps.dms.api.dms_activity.models import DmsActivity


class DmsActivitySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(source='user.get_full_name')

    class Meta:
        model = DmsActivity
        fields = '__all__'


class DmsActivityViewSet(viewsets.ModelViewSet):
    serializer_class = DmsActivitySerializer
    pagination_class = LargeResultsSetPagination
    model = DmsActivity
    change_keys = {
    }
    search_keywords = ['user__username', 'operation', 'ip']

    def get_queryset(self):
        if self.model is None:
            raise AssertionError('CustomViewSetForQuerySet need to include a model')
        user = self.request.query_params.get('user', None)
        # queryset = self.model.objects
        perm_list = self.request.user.role.permission.values_list('id', flat=True)
        queryset = self.model.objects
        if self.request.user.role.id == 1:
            queryset = queryset
        elif 21 in perm_list:
            queryset = queryset
        else:
            queryset = queryset.filter(user_id=self.request.user)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)
        date_from = (self.request.query_params.get('columns[1][search][value]', None))
        date_to = (self.request.query_params.get('columns[2][search][value]', None))

        # dateRange search
        if date_from and date_from is not None:
            if date_to and date_to is not None:
                queryset = queryset.filter(activity_time__range=[date_from, date_to])

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
