
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class Department(MPTTModel):
    name = models.CharField(max_length=50)

    manager = models.ForeignKey('rbac.User', null = True, related_name='manager')

    active = models.BooleanField(default=True)
    parent = TreeForeignKey('self', null=True, blank=True, related_name='children', db_index=True)

    class MPTTMeta:
        order_insertion_by = ['name']

    def __str__(self):
        return self.name