# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-23 05:53
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('category', '0003_auto_20170323_1140'),
    ]

    operations = [
        migrations.AlterField(
            model_name='metafield',
            name='max',
            field=models.IntegerField(default=200),
        ),
        migrations.AlterField(
            model_name='metafield',
            name='min',
            field=models.IntegerField(default=1),
        ),
    ]
