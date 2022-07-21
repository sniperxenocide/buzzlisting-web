from django.utils import timezone

from django.db import models

from apps.core.rbac.models import User


class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todo')
    text = models.CharField(max_length=50, blank=False, null=False)
    due_date = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return self.text