# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-28 12:26
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('category', '0010_auto_20170327_1430'),
    ]

    operations = [
        migrations.AlterField(
            model_name='metafield',
            name='max',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='metafield',
            name='min',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
