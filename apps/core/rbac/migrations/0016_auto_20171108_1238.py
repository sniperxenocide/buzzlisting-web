# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-11-08 06:38
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0015_auto_20171108_1226'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userdelegate',
            name='is_active',
            field=models.IntegerField(choices=[(0, 'No'), (1, 'Yes'), (-1, 'Upcoming')]),
        ),
    ]
