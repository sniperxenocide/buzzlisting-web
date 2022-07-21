import json

from django.db.models import Count
from django.db.models import Q
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import detail_route, api_view, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mptt.templatetags.mptt_tags import cache_tree_children

from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.rbac.models import User

from apps.dms.api.department.models import Department
from apps.dms.api.dms_activity.models import DmsActivity
from django.utils import timezone

from rest_framework import status


class DepartmentSerializer(serializers.ModelSerializer):
    # children = serializers.SerializerMethodField('recursive_node_to_dict')

    class Meta:
        model = Department
        fields = ['id', 'name', 'parent', 'active', 'manager']
        # fields = '__all__'


class DepartmentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = DepartmentSerializer
    http_method_names = ['post', 'delete', 'patch', 'put']
    queryset = Department.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Audit Trail
        parent = serializer.data['parent']
        description = ""
        if parent is None:
            description = "Department: '" + serializer.data['name'] + "' has been Created"
        else:
            parent_name = Department.objects.get(id=parent).name
            description = "Department: '" + serializer.data['name'] + "' has been Created under: " + parent_name
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Create Department", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if int(self.kwargs.get('pk')) == 1:
            return Response({
                'errors': 'You can not update the detail of this role.'
            }, status=404)

        if request.data.get('code') != '' and request.data.get('code') is not None:
            return Response({
                'errors': 'You can not update the role code. Please send patch request with either name, status or '
                          'permission.'
            }, status=404)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        # Audit Trail
        status = "Active" if request.data.get('active') is True else "Inactive"
        description = "Department: '" + request.data.get('name') + \
                      "' has been updated where  Status: " + status
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Department Update", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)

        description = "Department: '" + str(instance) + \
                      "' has been Deleted"
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation="Department Delete", ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@parser_classes((JSONParser,))
def getDepartment(request):
    root_nodes = cache_tree_children(Department.objects.all())
    dicts = []
    for n in root_nodes:
        dicts.append(recursive_node_to_dict(n))
    return Response(dicts, status=200)


@api_view(['GET'])
@parser_classes((JSONParser,))
def division(request, pk):
    try:
        department = Department.objects.get(pk=pk)
        ancestors = department.get_ancestors()

        if len(ancestors) > 0:
            div = ancestors[1]
            return Response({
                'id': div.id,
                'name': div.name,
            })

        raise serializers.ValidationError(
            {'detail': 'No ancestors found against this department.'})

    except Department.DoesNotExist:
        raise serializers.ValidationError(
            {'detail': 'You are violating the system by providing a wrong department id.'})


def recursive_node_to_dict(node):
    result = {
        'id': node.id,
        'text': node.name,
        'data': {
            'status': 'Active' if node.active else "Inactive",
            'manager': node.manager.first_name + ' ' + node.manager.last_name if node.manager else "None",
            'manager_id': node.manager.id if node.manager else "None",
            'users': User.objects.filter(department=node).count()
        }
    }
    children = [recursive_node_to_dict(c) for c in node.get_children()]
    if children:
        result['children'] = children
    return result


class UserInfoSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='reports_to.get_full_name')

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'department', 'reports_to', 'manager_name',
                  'phone_number']
        # fields = '__all__'


@api_view(['POST'])
@parser_classes((JSONParser,))
def OrgchartView(request, format=None):
    current_user = request.user
    print(request.data['type'])
    action = request.data['action']
    atype = request.data['type']
    dept = request.data['department']
    userid = request.data['userid']

    if atype == 'manager':
         if dept:
            if userid:
                try:
                    departmentdata = Department.objects.get(id=dept)
                    managerdata = User.objects.get(id=userid[0])
                    departmentdata.manager = managerdata
                    # Audit Trail
                    dept = str(departmentdata)
                    description = "Department: " + dept + " has been updated where Manager: " + managerdata.get_full_name()
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(',')[-1].strip()
                    else:
                        ip_address = request.META.get('REMOTE_ADDR')
                    DmsActivity(user=current_user, operation="Department Update",
                                ip=ip_address,
                                description=description, activity_time=timezone.now()).save()

                    departmentdata.save()
                except Exception as ex:
                    print(ex)
                    return Response({'status': 'failed', 'message': 'Department Update Failed'}, status=404)
                try:
                    # manager's manager can not be himself.
                    User.objects.filter(~Q(id=userid[0]), department=departmentdata).update(reports_to=managerdata)

                    # manage manager's manager
                    mng = User.objects.get(id=userid[0])
                    if departmentdata.parent:
                        mng.reports_to = departmentdata.parent.manager
                    mng.save()

                    # manager's children's manager
                    subordinates = departmentdata.get_children()
                    if subordinates:
                        for subdep in subordinates:
                            if subdep.manager:
                                deptmanager = subdep.manager
                                deptmanager.reports_to = mng
                                deptmanager.save()
                    userqueryset = User.objects.filter(department=departmentdata)
                    serializer = UserInfoSerializer(userqueryset, many=True)
                    return Response(serializer.data)

                except Exception as ex:
                    print(ex)
                    return Response({'status': 'failed', 'message': 'Manager Update Failed'}, status=404)
    elif atype == 'user':
        if action == 'add':
            if userid:
                # for uid in userid:
                try:
                    departmentdata = Department.objects.get(id=dept)
                    if not departmentdata.manager:
                        departmentdata.manager = User.objects.get(id=userid[0])
                        departmentdata.save()
                    userdata = User.objects.filter(id__in=userid).update(reports_to=departmentdata.manager,
                                                                         department=departmentdata)
                    # userdata.reports_to = departmentdata.manager
                    # userdata.department = departmentdata
                    # userdata.save()
                    userqueryset = User.objects.filter(department=departmentdata)
                    serializer = UserInfoSerializer(userqueryset, many=True)

                    # Audit Trail
                    users = []
                    for uid in userid:
                        users.append(User.objects.get(id=uid).get_full_name())
                    users_str = ", ".join(users)
                    dept = str(departmentdata)
                    description = "User: " + users_str + " has been assigned to Department:" + dept
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(',')[-1].strip()
                    else:
                        ip_address = request.META.get('REMOTE_ADDR')
                    DmsActivity(user=current_user, operation="Department Assign User",
                                ip=ip_address,
                                description=description, activity_time=timezone.now()).save()

                    return Response(serializer.data)
                except Exception as ex:
                    print(ex)
                    return Response({'status': 'failed', 'message': 'User Update Failed'}, status=404)
            else:
                return Response({'status': 'failed', 'message': 'User List Empty'}, status=404)

        elif action == 'remove':

            userdata = User.objects.filter(id__in=userid)
            User.objects.filter(id__in=userid).update(reports_to=None, department=None)

            # if user is manager
            try:
                Department.objects.filter(id=dept, manager_id__in=userid).update(manager=None)
                User.objects.filter(reports_to__in=userdata).update(reports_to=None)
                # Audit Trail
                users = []
                for uid in userid:
                    users.append(User.objects.get(id=uid).get_full_name())
                users_str = ", ".join(users)
                departmentdata = Department.objects.get(id=dept)
                dept = str(departmentdata)
                description = "User: " + users_str + " has been removed from Department:" + dept
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[-1].strip()
                else:
                    ip_address = request.META.get('REMOTE_ADDR')
                DmsActivity(user=current_user, operation="Department Remove User",
                            ip=ip_address,
                            description=description, activity_time=timezone.now()).save()
            except Exception as exp:
                print(exp)
                return Response({'status': 'failed', 'message': 'Manager removal failed'}, status=404)

            userqueryset = User.objects.filter(department_id=dept)
            serializer = UserInfoSerializer(userqueryset, many=True)
            return Response(serializer.data)
        else:
            return Response({'status': 'failed', 'message': 'Wrong Format'}, status=404)


class getFreeStaffViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = UserInfoSerializer
    http_method_names = ['get']
    queryset = User.objects.filter(department=None)


# return staff of a centain department
class getDepartmentUserViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = UserInfoSerializer
    http_method_names = ['get']

    def get_queryset(self):
        deptid = self.request.query_params.get('deptid', None)
        if deptid is not None:
            queryset = User.objects.filter(department=deptid)
        else:
            queryset = []

        return queryset


class MaricoDepartmentSerializer(serializers.ModelSerializer):
    parent = serializers.SerializerMethodField('get_parentnode')

    class Meta:
        model = Department
        fields = ['id', 'name', 'manager', 'parent']

    def get_parentnode(self, obj):
        return obj.parent.id if obj.parent else "#"


# return list of active department. not in nested format
class MaricoDepartmentViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = MaricoDepartmentSerializer
    http_method_names = ['get']

    def get_queryset(self):
        qset = Department.objects.root_nodes().filter(active=True)
        for rd in qset:
            queryd = rd.get_descendants().filter(active=True)
            qset = qset | queryd
        queryset = qset
        return queryset
