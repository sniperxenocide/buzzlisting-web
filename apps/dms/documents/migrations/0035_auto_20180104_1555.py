# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-01-04 09:55
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0034_auto_20180104_1107'),
    ]

    operations = [
        migrations.AddField(
            model_name='documents',
            name='annotations',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='documents',
            name='redactions',
            field=models.TextField(blank=True, null=True),
        ),
    ]
