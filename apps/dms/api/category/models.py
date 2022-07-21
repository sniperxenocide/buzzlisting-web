# from django.contrib.auth.models import User
from django.core.validators import RegexValidator

from apps.core.rbac.models import User, Role, Permission, Group
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class Category(MPTTModel):
    name = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=50)
    published = models.BooleanField(default=False)
    retention_period = models.CharField(max_length=50, null=True, blank=True)
    retention_policy = models.PositiveSmallIntegerField(default=0, choices=(
        (0, 'None'), (1, 'Archive'), (2, 'Delete'),))
    expiry_date = models.DateField(null=True, blank=True)
    parent = TreeForeignKey('self', null=True, blank=True, related_name='children', db_index=True)

    class MPTTMeta:
        order_insertion_by = ['name']

    def __str__(self):
        return self.name


class MetaField(models.Model):
    doc = models.ForeignKey(Category, on_delete=models.CASCADE)
    title = models.CharField(max_length=50, validators=[RegexValidator(
                                        regex='[-a-zA-Z0-9_]{3,50}$',
                                        message='Name contains alphanumeric, underscore. Length: 3 to 50'
                                    )]
                             )
    displayname = models.CharField(max_length=100, default='')
    data_type = models.PositiveSmallIntegerField(default=0, choices=(
        (0, 'String'), (1, 'Integer'), (2, 'TextArea'), (3, 'DropDown'), (4, 'Date'), (5, 'Float')))

    default_text = models.CharField(max_length=250, null=True, blank=True)
    required = models.PositiveSmallIntegerField(default=0, choices=((0, 'No'), (1, 'YES')))
    unique = models.PositiveSmallIntegerField(default=0, choices=((0, 'No'), (1, 'YES')))
    order = models.PositiveSmallIntegerField()
    max = models.PositiveIntegerField(null=True, blank=True)
    min = models.PositiveIntegerField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    class Meta:
       unique_together = (("doc", "order"), ("doc", "title"),)

    def __str__(self):
        return self.title


class DocTypePermission(models.Model):
    doc = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='document_permission')
    groups = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='doctype_groups')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # unique_together = (("doc", "order"),)
        unique_together = (("doc", "groups"),)
