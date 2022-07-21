import json
import datetime
from django.db.models import Q
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import detail_route, api_view, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from django.http import JsonResponse

from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.rbac.models import Group
from apps.dms.api.category.models import Category, MetaField, DocTypePermission
from apps.dms.documents.models import MetaDocumentJson
from rest_framework import status
from apps.dms.api.dms_activity.models import DmsActivity
from django.utils import timezone

from apps.dms.api.category.models import Category
from apps.core.api.viewset import CustomViewSetForQuerySet


class VariableExist(CustomViewSetForQuerySet):
    permission_id = []

    def list(self, request, *args, **kwargs):
        docid = self.request.query_params.get('doc_id', None)
        unique_id = self.request.query_params.get('unique_id', None)
        ind_doc_id = self.request.query_params.get('ind_doc', None)
        if docid is not None and unique_id is not None:
            value = self.request.query_params.get('value', None)
            if value is None:
                raise serializers.ValidationError({'Detail: value not given'})
            searchMetaDict = {
                "doc_id__doc_type__id": docid,
                "doc_id__deleted": False,
                "meta_json__" + unique_id: value,
            }
            list_values = MetaDocumentJson.objects.filter(**searchMetaDict)
            #print("j", list_values)
            if ind_doc_id is not None:
                list_values = list_values.exclude(doc_id_id=ind_doc_id)
            #print("k", list_values)
            if list_values.exists():
                return Response({
                    'exists': 'Y',
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'exists': 'N',
                }, status=status.HTTP_200_OK)
        else:
            raise serializers.ValidationError({'Detail: doc_id and unique_id required'})


class MetaFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaField
        fields = '__all__'


class MetaFieldViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination

    serializer_class = MetaFieldSerializer

    def get_queryset(self):

        docid = self.request.query_params.get('doc_id', None)
        if docid is not None:
            queryset = MetaField.objects.filter(doc_id=docid, is_deleted=False).order_by('order')
        else:
            queryset = MetaField.objects.filter(is_deleted=False).order_by('order')
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # Audit Trail
        title = serializer.data['title']
        parent = serializer.data['doc']
        parent_o = Category.objects.get(id=parent)
        operation = 'Create Metadata'
        docTypes = Category.objects.get(id=parent_o.id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '-> '.join([str(i) for i in docTypes])
        description = "Metadata '" + title + "' has been created under: '" + docType + "'"
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)
        # Audit Trail
        docTypes = Category.objects.get(id=instance.doc_id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '-> '.join([str(i) for i in docTypes])
        operation = 'Update Metadata'
        description = "Metadata '" + str(instance) + "' has been Updated under: '" + docType + "' "
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        docTypes = Category.objects.get(id=instance.doc_id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '-> '.join([str(i) for i in docTypes])
        operation = 'Delete Metadata'
        description = "'" + str(instance) + "' has been Deleted from: '" + docType + "'"
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        #self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RootSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField('get_group')

    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'parent', 'published', 'groups', 'retention_period', 'retention_policy']

    def get_group(self, obj):
        return [{
            'group': list(DocTypePermission.objects.filter(doc=obj.id).values('groups__id', 'groups__name'))
        }]


class RootViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = RootSerializer
    queryset = Category.objects.root_nodes()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Audit Trail
        name = serializer.data['name']
        type = serializer.data['type']
        operation_name = 'Category' if type == 'cat' else 'Document Type'
        operation = 'Create Category' if type == 'cat' else 'Create Document Type'
        description = operation_name + ": '" + name + "' has been Created"
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class DescendantSerializer(serializers.ModelSerializer):
    descendants = serializers.SerializerMethodField('get_descendant')

    # groups = serializers.SerializerMethodField('get_group')

    class Meta:
        model = Category
        fields = ['id', 'name', 'descendants', 'type', 'parent', 'published', 'retention_period', 'retention_policy']

    def get_descendant(self, obj):
        return [{
                    'id': desc.id,
                    'name': desc.name,
                    'type': desc.type,
                    'parent': desc.parent_id,
                    'published': desc.published,
                    'retention_period': desc.retention_period,
                    'retention_policy': desc.retention_policy,
                    'group': list(DocTypePermission.objects.filter(doc=desc.id).values('groups__id', 'groups__name'))
                } for desc in obj.get_descendants(include_self=True)]

        # def get_group(self,obj):
        #     print(DocTypePermission.objects.filter(doc=obj.id))
        #
        #     return Response( DocTypePermission.objects.filter(doc=obj.id))


class DescendantsViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = DescendantSerializer
    queryset = Category.objects.all()


class SiblingsSerializer(serializers.ModelSerializer):
    siblings = serializers.SerializerMethodField('get_sibling')

    class Meta:
        model = Category
        fields = ['id', 'name', 'siblings', 'type', 'parent', 'published', 'retention_period', 'retention_policy']

    def get_sibling(self, obj):
        sibling_parent = ""
        for sibling in obj.get_siblings(include_self=True):
            if sibling.parent:
                sibling_parent = sibling.parent.name
            else:
                sibling_parent = ""
        return [{
                    'id': sibling.id,
                    'name': sibling.name,
                    'type': sibling.type,
                    'parent': sibling.parent_id,
                    'parent_name': sibling_parent,
                    'published': sibling.published,
                    'retention_policy': sibling.retention_policy,
                    'retention_period': sibling.retention_period,
                    'group': list(DocTypePermission.objects.filter(doc=sibling.id).values('groups__id', 'groups__name'))
                } for sibling in obj.get_siblings(include_self=True)]


class SiblingsViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = SiblingsSerializer
    queryset = Category.objects.all()


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField('get_childrens')

    class Meta:
        model = Category
        fields = ['id', 'name', 'children', 'type', 'parent', 'published', 'retention_policy', 'retention_period']

    def get_childrens(self, obj):
        return [{
                    'id': child.id,
                    'name': child.name,
                    'type': child.type,
                    'parent': child.parent_id,
                    'published': child.published,
                    'retention_policy': child.retention_policy,
                    'retention_period': child.retention_period,
                    'group': list(DocTypePermission.objects.filter(doc=child.id).values('groups__id', 'groups__name'))
                } for child in obj.get_children()]


class CategoryViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Audit Trail
        name = serializer.data['name']
        type = serializer.data['type']
        parent = serializer.data['parent']
        parent_o = Category.objects.get(id=parent)
        operation_name = 'Category' if type == 'cat' else 'Document Type'
        operation = 'Create Category' if type == 'cat' else 'Create Document Type'
        docTypes = Category.objects.get(id=parent_o.id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '-> '.join([str(i) for i in docTypes])
        description = operation_name + " '" + name + "' has been Created under: '" + docType + "'"
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        retention_month = request.data.get('retention_period')
        retention_type = request.data.get('retention_policy')
        publish_status = request.data.get('published')

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)
        # Audit Trail
        type = instance.type
        status = ''
        if publish_status:
            status = "Published" if instance.published == True else "Not Published"
        elif retention_type:
            if retention_type == '1':
                status = "Archive- in {} months".format(instance.retention_period)
            elif retention_type == "2":
                status = "Delete- in {} months".format(instance.retention_period)
            else:
                status = "None"
        docTypes = Category.objects.get(id=instance.id)
        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
        docType = '-> '.join([str(i) for i in docTypes])
        operation = 'Update Category' if type == 'cat' else 'Update Document Type'
        type = 'Category' if type == 'cat' else 'Document Type'
        description = type+" '" + docType + "' has been Updated. Status: " + status
        category_instance = Category.objects.get(id=instance.id)
        if retention_type:
            if retention_type == '0':
                category_instance.retention_period = "0"
                category_instance.expiry_date = None
                category_instance.save()
            else:
                category_instance.expiry_date = datetime.date.today() + datetime.timedelta(int(retention_month)*365/12)
                category_instance.save()
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        type = instance.type
        docTypes = Category.objects.get(id=instance.id)
        docTypes = docTypes.get_ancestors(ascending=False)
        docType = '-> '.join([str(i) for i in docTypes])
        operation = 'Delete Category' if type == 'cat' else 'Delete Document Type'
        type = 'Category' if type == 'cat' else 'Document Type'
        description = type+" '" + str(instance) + "' has been Deleted from: '" + docType + "'"
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[-1].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        DmsActivity(user=self.request.user, operation=operation, ip=ip_address,
                    description=description, activity_time=timezone.now()).save()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentTypeSerializer(serializers.ModelSerializer):
    ancestors = serializers.SerializerMethodField('get_ancestor')

    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'parent', 'ancestors', 'published', 'retention_policy', 'retention_period']

    def get_ancestor(self, obj):
        return [{
                    'id': ancestor.id,
                    'name': ancestor.name,
                    'type': ancestor.type,
                    'retention_policy': ancestor.retention_policy,
                    'retention_period': ancestor.retention_period,
                    'group': list(
                        DocTypePermission.objects.filter(doc=ancestor.id).values('groups__id', 'groups__name'))
                } for ancestor in obj.get_ancestors()]


class DocumentTypeViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = DocumentTypeSerializer
    http_method_names = ['get']

    def get_queryset(self):
        user = self.request.user
        if user.role_id == 1:
            queryset = Category.objects.filter(type='doc', published=True)
        else:
            queryset = Category.objects.filter(type='doc', published=True)
            to_be_removed = []
            for dat in queryset:
                if not hasDocPermission(user, dat.id):
                    to_be_removed.append(dat.id)
            queryset = queryset.filter(~Q(id__in=to_be_removed))

        return queryset


@api_view(['POST'])
@parser_classes((JSONParser,))
def AttachDocumentPermission(request, format=None):
    current_user = request.user
    docid = request.data['docid']
    groups = request.data['group']
    if docid:
        try:
            res = DocTypePermission.objects.filter(doc_id=docid).delete()
            if groups:
                for obj in groups:
                    DocTypePermission.objects.create(doc_id=docid, groups_id=obj)
        except Exception as ex:
            print("HERE", ex)
            pass
    dd = list(DocTypePermission.objects.filter(doc_id=docid).values('groups__id', 'groups__name'))
    # Audit Trail
    group_name = []
    document = Category.objects.get(id=docid)
    for d in dd:
        group_name.append((d['groups__name']))
    g_name = ", ".join(group_name)
    description = "Document '" + str(document) + "' has been Added to Group: '" + g_name + "'"
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[-1].strip()
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    DmsActivity(user=current_user, operation="Assign Group", ip=ip_address,
                description=description, activity_time=timezone.now()).save()
    return Response({'result': dd}, status=200)


class JStreeRootSerializer(serializers.ModelSerializer):
    # children= serializers.SerializerMethodField('get_child')
    text = serializers.SerializerMethodField('get_name')
    parent = serializers.SerializerMethodField('get_parentnode')
    type = serializers.SerializerMethodField('get_types')

    class Meta:
        model = Category
        fields = ['id', 'text', 'type', 'parent', 'published']

    # def get_child(self, obj):
    #     return False if obj.is_leaf_node() else True

    def get_parentnode(self, obj):
        return obj.parent.id if obj.parent else "#"

    def get_name(self, obj):
        return obj.name

    def get_types(self, obj):
        return obj.type
        # return obj.type if obj.parent else "root"


class JStreeRootViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = JStreeRootSerializer
    http_method_names = ['get']

    def get_queryset(self):
        user = self.request.user
        if user.role_id == 1:
            qset = Category.objects.root_nodes()
            for rd in qset:
                queryd = rd.get_descendants()
                qset = qset | queryd
            queryset = qset

        else:
            qset = Category.objects.root_nodes().filter(Q(type='doc', published=True) | Q(type='cat'))
            for rd in qset:
                queryd = rd.get_descendants().filter(Q(type='doc', published=True) | Q(type='cat'))
                qset = qset | queryd
            queryset = qset
            to_be_removed = []
            for dat in queryset:
                if dat.type == 'doc':
                    if not hasDocPermission(user, dat.id):
                        to_be_removed.append(dat.id)
            queryset = queryset.filter(~Q(id__in=to_be_removed))
        return queryset


def hasDocPermission(userid, doctype):
    grps = Group.objects.filter(user=userid)
    if grps.count():
        allowgrp = DocTypePermission.objects.filter(doc_id=doctype).values('groups').filter(groups__in=grps)
        if allowgrp.count():
            return True
    return False


class JsTreeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'parent', 'published']


class JsTreeCategoryViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.DjangoModelPermissions]
    pagination_class = LargeResultsSetPagination
    serializer_class = JsTreeCategorySerializer
    http_method_names = ['get']

    def get_queryset(self):
        user = self.request.user
        docid = self.request.query_params.get('id', None)
        if docid is not None:
            if self.request.user.role.id == 1:
                queryset = Category.objects.filter(parent_id=docid)
            else:
                queryset = Category.objects.filter(parent_id=docid)
                to_be_removed = []
                for dat in queryset:
                    if dat.type == 'doc':
                        if not hasDocPermission(user, dat.id):
                            to_be_removed.append(dat.id)
                        elif dat.published != True:
                            to_be_removed.append(dat.id)
                queryset = queryset.filter(~Q(id__in=to_be_removed))

        return queryset
