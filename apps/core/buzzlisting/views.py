from django.urls import reverse_lazy

from django.views.generic import TemplateView

from conf import settings
import json
from collections import OrderedDict
from functools import reduce
import operator
from datetime import datetime
import re
import calendar
import pytz
import requests
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.core.paginator import Paginator
from django.db.models import Q, Count, QuerySet, ProtectedError, Avg, F
import base64
import os
import elasticsearch
from django.core.files.storage import default_storage
from django.db.models.query import RawQuerySet
from django.db.models import Q
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Sum
from django.utils.datastructures import MultiValueDictKeyError
from rest_framework.parsers import JSONParser
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.api.validators import UniqueNameValidator
from rest_framework import serializers
from apps.core.api.permission import GreenOfficeApiBasePermission

from apps.core.rbac.models import User, Role, Permission, Group, UserDelegate, AppUser


def report_sidebar(self):
    sidebar = []
    permission = 0
    permissions = self.request.session['permission_list']


    residential = {
        'allowed': ['allowed', 'Residential', reverse_lazy('buzzlisting:residential'), 'zmdi-account-box', []],
        'not-allowed': ['not-allowed', 'Residential', '#', 'zmdi-account-box', []],
    }

    condo = {
        'allowed': ['allowed', 'Condo', reverse_lazy('buzzlisting:condo'), 'zmdi-account-box', []],
        'not-allowed': ['not-allowed', 'Condo', '#', 'zmdi-account-box', []],
    }

    commercial = {
        'allowed': ['allowed', 'Commercial', reverse_lazy('buzzlisting:commercial'), 'zmdi-account-box', []],
        'not-allowed': ['not-allowed', 'Commercial', '#', 'zmdi-account-box', []],
    }



    dms_report = {
        'allowed': ['allowed', 'DMS', '#', 'zmdi zmdi-file-text', [
            ['allowed', 'Activity', reverse_lazy('dms:dms_report:dms_activity'), 'zmdi zmdi-local-activity', []],
            ['allowed', 'Document Summary', reverse_lazy('dms:dms_report:document_summary'), 'zmdi zmdi-fullscreen',
             []],
            ['allowed', 'Upload Record', reverse_lazy('dms:dms_report:upload_report'), 'zmdi zmdi-upload',
             []],
            ['allowed', 'Page Count', reverse_lazy('dms:dms_report:page_count'), 'zmdi zmdi-upload',
             []],
        ], ],
        'not-allowed': ['not-allowed', 'DMS', '#', 'zmdi zmdi-file-text', [
            ['not-allowed', 'Activity', '#', 'zmdi zmdi-local-activity', []],
            ['not-allowed', 'Document Summary', '#', 'zmdi zmdi-fullscreen', []],
            ['not-allowed', 'Upload Record', '#', 'zmdi zmdi-upload', []],
            ['not-allowed', 'Page count', '#', 'zmdi zmdi-upload', []],
        ], ],
    }

    workflow_report = {
        'allowed': ['allowed', 'Workflow', '#', 'zmdi zmdi-rotate-cw', [
            ['allowed', 'KPI Report', reverse_lazy('workflow:workflow_report:kpi'), 'zmdi zmdi-trending-up',
             []],
            ['allowed', 'Workflow Email', reverse_lazy('workflow:workflow_report:wf_email'),
             'zmdi-email-open', []],
            ['allowed', 'Workflow Activity', reverse_lazy('workflow:workflow_report:wf_activity'),
             'zmdi zmdi-directions-run', []],
        ], ],
        'not-allowed': ['not-allowed', 'Workflow', '#', 'zmdi zmdi-rotate-cw', [
            ['not-allowed', 'KPI Report', '#', 'zmdi zmdi-trending-up', []],
            ['not-allowed', 'Workflow Email', '#', 'zmdi-email-open', []],
            ['not-allowed', 'Workflow Activity', '#', 'zmdi zmdi-directions-run', []],
        ], ],
    }

    if self.request.user.role.id == 1:
        permission = 1
        sidebar.append(residential['allowed'])
        sidebar.append(condo['allowed'])
        sidebar.append(commercial['allowed'])


        # if settings.DMS == "9dL53eBFDK":
        #     sidebar.append(dms_report['allowed'])
        #
        # if settings.WORKFLOW == "aBX3RODumf":
        #     sidebar.append(workflow_report['allowed'])
    else:
        if 21 in permissions:
            permission = 1
            sidebar.append(login_report['allowed'])
        else:
            sidebar.append(login_report['not-allowed'])

            # if settings.DMS == '9dL53eBFDK':
            #     if 21 in permissions:
            #         permission = 1
            #         sidebar.append(dms_report['allowed'])
            #     else:
            #         sidebar.append(dms_report['not-allowed'])
            #
            # if settings.WORKFLOW == "aBX3RODumf":
            #     if 3 in permissions:
            #         permission = 1
            #         sidebar.append(workflow_report['allowed'])
            #     else:
            #         sidebar.append(workflow_report['not-allowed'])

    return {
        'sidebar': sidebar,
        'permission': permission,
    }





class ResidentialView(TemplateView):
    template_name = 'core/buzzlisting/residential.html'
    sidebar_menu = None
    permission = 0

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        r = report_sidebar(self)
        self.sidebar_menu = r.get('sidebar')
        self.permission = r.get('permission')
        return self.render_to_response(context)


class CondoView(TemplateView):
    template_name = 'core/buzzlisting/condo.html'
    sidebar_menu = None
    permission = 0

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        r = report_sidebar(self)
        self.sidebar_menu = r.get('sidebar')
        self.permission = r.get('permission')
        return self.render_to_response(context)


class CommercialView(TemplateView):
    template_name = 'core/buzzlisting/commercial.html'
    sidebar_menu = None
    permission = 0

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        r = report_sidebar(self)
        self.sidebar_menu = r.get('sidebar')
        self.permission = r.get('permission')
        return self.render_to_response(context)



