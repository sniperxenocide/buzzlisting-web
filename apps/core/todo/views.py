from requests import Response
from rest_framework import serializers
from rest_framework.viewsets import ModelViewSet

from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.todo.models import Todo


class TodoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Todo
        fields = '__all__'


class TodoViewSet(ModelViewSet):
    serializer_class = TodoSerializer
    pagination_class = LargeResultsSetPagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    # def create(self, request, *args, **kwargs):
    #     print(request.data.get('due_date'))
    #     raise

    def get_queryset(self):
        queryset = Todo.objects.filter(user=self.request.user).order_by('-id')
        return queryset

    def delete(self, request, pk, format=None):
           event = self.get_object(pk)
           event.delete()
           return Response("Object Deleted")

