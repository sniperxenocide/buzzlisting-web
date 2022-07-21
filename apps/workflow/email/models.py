from __future__ import unicode_literals

from django.db import models

from apps.workflow.bpmn.models import Project, Task

from django.utils import timezone


class Email(models.Model):
    project = models.ForeignKey(Project)
    task = models.ForeignKey(Task, related_name='case')
    subject = models.TextField(null=False)
    sender = models.EmailField(null=False, blank=False)
    receiver = models.EmailField(null=False, blank=False)
    date = models.DateTimeField(default=timezone.now)
    message = models.TextField(null=False)
    error = models.CharField(max_length=200, null=True)
    status = models.CharField(max_length=50)

    def __str__(self):
        return '{} {} {}'.format(self.id, self.project.id, self.task.id)
