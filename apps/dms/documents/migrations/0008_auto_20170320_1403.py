# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-20 08:03
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('documents', '0007_auto_20170320_1354'),
    ]

    operations = [
        migrations.AddField(
            model_name='documents',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='documents',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='deletedby', to=settings.AUTH_USER_MODEL),
        ),
    ]
