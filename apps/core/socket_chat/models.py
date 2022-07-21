from django.db import models

from apps.core.rbac.models import User


class Statuses(models.Model):
    status_choices = (
        ('unseen', 'unseen'),
        ('seen', 'seen'),
    )
    users = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, blank=False, null=False, default="unseen", choices=status_choices)


class Comments(models.Model):
    text = models.CharField(max_length=255, blank=False, null=False)
    recipients = models.ManyToManyField(Statuses, blank=False, related_name='recipientss')
    date_sent = models.DateTimeField(auto_now_add=True)






