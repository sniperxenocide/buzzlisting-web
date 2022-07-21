from rest_framework import serializers

from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from .models import Comments, Statuses


class CommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comments
        fields = '__all__'


class CommentsViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = CommentsSerializer
    pagination_class = LargeResultsSetPagination
    model = Comments
    search_keywords = ['name']
    permission_id = [1, ]


class StatusesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statuses
        fields = '__all__'


class StatusesViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = StatusesSerializer
    pagination_class = LargeResultsSetPagination
    model = Statuses
    search_keywords = ['name']
    permission_id = [1, ]
