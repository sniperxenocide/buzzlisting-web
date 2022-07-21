import json

import elasticsearch
from django.db import transaction
from django.forms.models import model_to_dict
from elasticsearch_dsl import *
from apps.core.elasticsearch import connection
from apps.core.rbac.models import User
from apps.workflow.bpmn.models import Project, Application
from conf import licensed

connection.create()


class ApplicationDocType(DocType):
    project = Text()
    number = Long()
    status = Text()
    init_user = Keyword()
    init_user_id = Long()
    current_user_id = Long()
    created_at = DateHistogramFacet()
    updated_at = DateHistogramFacet()
    finished_at = DateHistogramFacet()
    data = Nested()
    duration = DateHistogramFacet()
    delay = DateHistogramFacet()

    class Meta:
        index = licensed.WORKFLOW_SEARCH_INDICES
        doc_type = 'application'

    def add_data(self, data):
        self.data.append(data)


class IndexApplication:
    def __init__(self, application):
        self.application = model_to_dict(application)
        ApplicationDocType.init()
        self.add_to_index()

    def add_to_index(self):
        doc_type = ApplicationDocType()

        for k, v in self.application.items():
            if k == 'data':
                doc_type.add_data({i: json.loads(v)[i] for i in json.loads(v) if 'file' not in i})

            elif k == 'id':
                doc_type.meta.id = v

            elif k == 'init_user':
                user = User.objects.get(pk=v)
                doc_type[k] = user.get_full_name()
                doc_type['init_user_id'] = user.id

            elif k == 'current_user':
                user = User.objects.get(pk=v)
                doc_type[k] = user.get_full_name()
                doc_type['current_user_id'] = user.id

            elif k == 'project':
                doc_type[k] = Project.objects.get(pk=v).title

            else:
                doc_type[k] = v
        doc_type.save()


class ApplicationSearch:
    def __init__(self, s_data):
        self.s_data = s_data

    def quick_search(self):
        result = []
        s_query = ApplicationDocType.search().query(Q("multi_match", query=self.s_data['keyword'], fields=['_all']))

        try:
            response = s_query[self.s_data['start']:self.s_data['start'] + self.s_data['length']].execute()

            if len(response.to_dict()['hits']['hits']) > 0:
                for source in response.to_dict()['hits']['hits']:
                    try:
                        Application.objects.get(pk=source['_id'])
                        r_dict = dict()
                        r_dict['app_id'] = source['_id']
                        r_dict['app_number'] = source['_source']['number']
                        r_dict['init_user'] = source['_source']['init_user']
                        r_dict['current_user'] = source['_source']['current_user']
                        r_dict['project'] = source['_source']['project']
                        result.append(r_dict)

                    except Application.DoesNotExist:
                        pass

        except elasticsearch.ConnectionError:
            return {'detail': 'Please check your search engine connection is down or not'}

        except elasticsearch.NotFoundError:
            pass

        return {
            "recordsTotal": len(result),
            "draw": self.s_data['draw'],
            "data": result
        }
