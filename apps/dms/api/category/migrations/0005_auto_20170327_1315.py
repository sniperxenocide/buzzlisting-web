# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-27 07:15
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('category', '0004_auto_20170323_1153'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='metafield',
            name='max',
        ),
        migrations.RemoveField(
            model_name='metafield',
            name='min',
        ),
    ]
