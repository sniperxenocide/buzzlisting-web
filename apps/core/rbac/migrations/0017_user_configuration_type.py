# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-01-02 06:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0016_auto_20171108_1238'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='configuration_type',
            field=models.IntegerField(choices=[(0, 'cannot configure'), (1, 'can configure and DMS'), (2, 'can configure and workflow')], default=0),
        ),
    ]
