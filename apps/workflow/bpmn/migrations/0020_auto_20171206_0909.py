# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-12-06 03:09
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpmn', '0019_eform_variables_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='eform',
            name='variables_id',
            field=models.TextField(blank=True, null=True),
        ),
    ]
