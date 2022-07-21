import operator
from functools import reduce

from django.db.models import Q
from rest_framework import viewsets


class CustomViewSetForQuerySet(viewsets.ModelViewSet):
    model = None
    change_keys = None
    search_keywords = None
    permission_id = None

    def get_queryset(self):
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')

        queryset = self.model.objects.filter()
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

        return queryset

    def get_permissions(self):
        if self.permission_id is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a permission_id')

        for permission in self.permission_classes:
            if permission.__name__ == 'GreenOfficeApiBasePermission':
                return [permission(self.permission_id)]
            else:
                return [permission()]
