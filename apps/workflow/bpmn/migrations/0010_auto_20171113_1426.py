# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-11-13 08:26
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpmn', '0009_appquery_is_answered'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appquery',
            name='date',
            field=models.DateField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='appquery',
            name='expiry_date',
            field=models.DateField(blank=True, null=True, verbose_name='expiry_date'),
        ),
    ]
