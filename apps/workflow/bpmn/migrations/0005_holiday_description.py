# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-09-10 04:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpmn', '0004_holiday'),
    ]

    operations = [
        migrations.AddField(
            model_name='holiday',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]