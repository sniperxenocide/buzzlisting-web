from django.db import models

from apps.core.rbac.models import User
from apps.dms.documents.models import Documents
from django.utils.timezone import get_current_timezone
from datetime import datetime


class DmsActivity(models.Model):
    user = models.ForeignKey(User)
    document = models.ForeignKey(Documents, null=True, blank=True)
    activity_time = models.DateTimeField(auto_now=True)
    description = models.TextField(null=False)
    metadata = models.TextField(null=True, blank=True)
    operation = models.CharField(max_length=200, null=False)
    ip = models.GenericIPAddressField()

    def __str__(self):
        return '{} - {} - {}'.format(self.user.username, str(self.ip), self.activity_time)

    #def save(self, *args, **kwargs):
    #    self.activity_time = datetime.now().replace(tzinfo=get_current_timezone())
    #    super(DmsActivity, self).save(*args, **kwargs)