# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2019-07-28 04:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0039_auto_20190724_1519'),
    ]

    operations = [
        migrations.AlterField(
            model_name='freehold',
            name='IDXUpdatedDate',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='freehold',
            name='PixUpdatedDate',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='freehold',
            name='UpdatedTimestamp',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='freehold',
            name='VirtualTourUploadDate',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='freehold',
            name='WaterFrontage',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]