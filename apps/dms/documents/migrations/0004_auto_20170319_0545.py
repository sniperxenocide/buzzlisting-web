# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-19 05:45
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0003_auto_20170316_1250'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documents',
            name='filepath',
            field=models.CharField(max_length=255),
        ),
    ]
