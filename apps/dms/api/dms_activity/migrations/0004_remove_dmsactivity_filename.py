# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-28 08:33
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dms_activity', '0003_dmsactivity_filename'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dmsactivity',
            name='filename',
        ),
    ]
