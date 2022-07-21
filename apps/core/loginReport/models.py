from django.db import models
from django.utils import timezone

from apps.core.rbac.models import User


class LoginReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_data')
    login = models.DateTimeField(null=True, blank=True)
    logout = models.DateTimeField(null=True, blank=True)
    ip = models.GenericIPAddressField()

    def __str__(self):
        return '{} - {} - {}'.format(self.user.username, str(self.ip), self.login)
