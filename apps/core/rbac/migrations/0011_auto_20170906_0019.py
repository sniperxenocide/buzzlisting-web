# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-09-05 18:19
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0010_auto_20170906_0002'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.ForeignKey(default=2, on_delete=django.db.models.deletion.PROTECT, related_name='user', to='rbac.Role'),
        ),
    ]
