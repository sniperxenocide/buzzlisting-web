# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2018-03-25 05:58
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rbac', '0025_houselocation'),
    ]

    operations = [
        migrations.CreateModel(
            name='Favourites',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.IntegerField(choices=[(1, 'Residential'), (2, 'Condo'), (3, 'Commercial')])),
                ('appuser', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='rbac.AppUser')),
                ('commercial', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='rbac.Commercial')),
                ('condo', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='rbac.Condo')),
                ('freehold', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='rbac.Freehold')),
            ],
        ),
    ]
