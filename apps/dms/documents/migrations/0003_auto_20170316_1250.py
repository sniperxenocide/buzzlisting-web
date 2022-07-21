# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-16 12:50
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_auto_20170314_1335'),
    ]

    operations = [
        migrations.AddField(
            model_name='documents',
            name='encryption',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='documents',
            name='locked_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]