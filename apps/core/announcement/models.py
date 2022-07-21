from django.utils import timezone
from django.db import models

from apps.core.rbac.models import User, Group

status_choices = (
    ('1', 'User'),
    ('2', 'Group'),
    ('3', 'All Users'),
)


class Announcement(models.Model):
    type = models.CharField(choices=status_choices, max_length=50)
    user = models.ManyToManyField(User, blank=True, related_name='announcement_users')
    group = models.ManyToManyField(Group, blank=True, related_name='announcement_groups')
    date = models.DateTimeField(default=timezone.now)
    message = models.TextField(null=False)

    def __str__(self):
        return self.message
