# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-01-02 09:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpmn', '0020_auto_20171206_0909'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='out_open',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='inputdocument',
            name='attached',
            field=models.BooleanField(default=False),
        ),
    ]