# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-03-25 06:53
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0026_favourites'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='favourites',
            name='commercial',
        ),
        migrations.RemoveField(
            model_name='favourites',
            name='condo',
        ),
        migrations.RemoveField(
            model_name='favourites',
            name='freehold',
        ),
        migrations.RemoveField(
            model_name='favourites',
            name='type',
        ),
        migrations.AddField(
            model_name='favourites',
            name='house',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='rbac.HouseLocation'),
        ),
    ]
