# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-04-15 06:55
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0032_contactrequest_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='appviewreport',
            name='latitude',
            field=models.DecimalField(decimal_places=8, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name='appviewreport',
            name='longitude',
            field=models.DecimalField(decimal_places=8, max_digits=12, null=True),
        ),
    ]
