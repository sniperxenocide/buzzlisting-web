# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-04-08 04:50
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0029_menuitems'),
    ]

    operations = [
        migrations.CreateModel(
            name='LicenseText',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
            ],
        ),
    ]
