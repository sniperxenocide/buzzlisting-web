# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-09-18 05:10
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpmn', '0006_auto_20170918_1050'),
    ]

    operations = [
        migrations.AlterField(
            model_name='holiday',
            name='description',
            field=models.TextField(),
        ),
    ]
