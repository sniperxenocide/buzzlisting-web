# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-03-20 12:05
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0022_auto_20180315_0521'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppViewReport',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('viewed_at', models.DateTimeField(auto_now_add=True)),
                ('ip', models.GenericIPAddressField()),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='Applogin_data', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
