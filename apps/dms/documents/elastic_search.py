import json
import mimetypes
from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch_dsl import DocType, Date, Nested, Boolean, analyzer, InnerObjectWrapper, Completion, Keyword, Text, \
    Mapping, MetaField, Index, Search
from elasticsearch_dsl.query import MultiMatch, Match, Q
from rest_framework.response import Response

from apps.core.elasticsearch import connection
from apps.dms.api.category.models import Category, MetaField, DocTypePermission

from apps.core.rbac.models import Group, User
from apps.dms.documents.models import Documents, Comments
from conf import licensed

html_strip = analyzer('html_strip',
                      tokenizer="standard",
                      filter=["standard", "lowercase", "stop", "snowball"],
                      char_filter=["html_strip"]
                      )


class Comment(InnerObjectWrapper):
    def age(self):
        return datetime.now() - self.created_at


class Elastic:
    def __init__(self):
        if (not Dms.exists()):
            Dms.init()

    def save(data):
        try:
            # instantiate the document
            first = Dms(
                filename=data.get('filename'),
                creation_date=data.get('creation_date'),
                expiry_date=data.get('expiry_date'),
                action_upon_expiry=data.get('action_upon_expiry'),
                published=True,
                locked=False,
                locked_by=0,
                locked_at='',
                archived=False,
                archived_by=0,
                archived_at='',
                deleted=False,
                deleted_by=0,
                deleted_at='',
                box_number=data.get('box_number'),
                shelf_number=data.get('shelf_number'),
                watermark=0,
                watermarked_by=0,
                encryption=False,
                version=data.get('version'),
                doc_type=data.get('doc_type_id'),
                uploader=data.get('uploader'),
                uploader_id=data.get('uploader_id'),
                thumbnail='',
                metas=json.loads(data.get('metadata')),
                parent=data.get('parent_id'),
                version_uploader=data.get('version_uploader_id'),
                extension=data.get('extension'),
                source=data.get('source'),
                app_id=data.get('app_id')
            )
            # assign some field values, can be values or lists of values
            # first.category = ['everything', 'nothing']
            first.tags = json.loads(data.get('tags'))
            # every document has an id in meta
            first.meta.id = data.get('id')
            # Add comment
            if data.get('comment'):
                comment = data.get('comment')
                first.add_comment(comment.get('commentor_id'), comment.get('comment'))
            # first.add_meta_data(json.loads(data.get('metadata')))
            # save the document into the cluster
            print("-------------------", first.filename)
            first.save()

        except Exception as ex:
            print("exception---------", ex)
            return Response(ex, status=404)

    def update(data, id=""):
        try:
            if not id:
                id = data.id
            first = Dms.get(id=id)
            first.update(
                filename=data.filename,
                creation_date=data.creation_date,
                expiry_date=data.expiry_date,
                action_upon_expiry=data.action_upon_expiry,
                published=data.published,
                locked=data.locked,
                locked_by=data.locked_by_id,
                locked_at=data.locked_at,
                archived=data.archived,
                archived_by=data.archived_by_id,
                archived_at=data.archived_at,
                watermark=data.watermark,
                watermarked_by=data.watermarked_by,
                box_number=data.box_number,
                shelf_number=data.shelf_number,
                deleted=data.deleted,
                deleted_by=data.deleted_by_id,
                deleted_at=data.deleted_at,
                version=data.version,
                encryption=data.encryption,
                doc_type=data.doc_type_id,
                parent=data.parent_id,
                thumbnail=data.thumbnail,
                tags=json.loads(data.tags),
                metas=json.loads(data.metadata),
                extension=data.extension,
                filepath=data.filepath,
            )
        except Exception as ex:
            return Response(ex, status=404)

    def search(query):
        if Dms.exists():
            type = query.get('search_type')
            result = getattr(Elastic, type)(query)
            result.update({
                "draw": query.get('draw')
            })
        else:
            result = {
                "draw": 1,
                "hits": [],
                "total": 0
            }
        return result

    def standard(query):
        user_id = (query.get('user_id'))
        data = query.get('keyword')
        offset = query.get('start')
        limit = query.get('length')
        q = Q("multi_match", query=data, fields=['_all'])
        s = Dms.search().query(q)
        s = s.highlight('filename', fragment_size=50)
        s = s.highlight_options(order='score')
        s = s.filter('term', published=True)
        s = s.filter('term', deleted=False)
        s = s.filter('term', archived=False)
        s = s[offset:limit + offset]

        result = s.execute().to_dict()
        result = result.get('hits')
        result.update({'user_id': user_id})
        return Elastic.process(result)

    def advanced(query):
        user_id = (query.get('user_id'))
        data = query.get('keyword')
        docType = data.get('doc_type')
        offset = query.get('start')
        limit = query.get('length')
        match = data.get('match')
        archived = data.get('archived')
        # if docType == "0" and match:
        #     data.__delitem__('doc_type')
        # data.__delitem__('match')
        # data.__delitem__('archived')
        print("ES", data)
        result = {}
        query = []
        for k in data:
            if data[k]:
                if k not in ['match', 'archived']:
                    print("p")
                    print("E", Elastic)
                    print("k", k)
                    print("d", data[k])
                    q = getattr(Elastic, k)(data[k])
                    print('r', q)
                    if isinstance(q, list):
                        query = query + q
                    else:
                        query.append(q)

        if match:
            q = Q(
                'bool',
                must=query,
            )

        else:
            q = Q(
                'bool',
                should=query,
                minimum_should_match=1
            )
        s = Dms.search()
        s = s.query(q)
        s = s.highlight('filename', fragment_size=50)
        s = s.highlight_options(order='score')
        # s = s.filter('term', published=True)
        # s = s.filter('term', deleted=False)
        s = s[offset:limit + offset]
        print('s', s)
        if not archived:
            pass
            # s = s.filter('term', archived=False)

        try:
            result = s.execute().to_dict()
        except Exception as e:
            print(e.__str__)
        result = result.get('hits')
        result.update({'user_id': user_id})
        print('rr', result)
        return Elastic.process(result)

    def process(result):
        from apps.dms.api.document.views import hasSearchPermission
        user_id = result.get('user_id')
        search = []
        count = result.get('total')
        for doc in result.get('hits'):
            # print(doc)
            try:
                locked_by = ""
                uid = doc.get('_source').get('locked_by')
                if uid is None:
                    locked_by = "None"
                elif uid is 0:
                    locked_by = "None"
                else:
                    locked_by = User.objects.get(id=uid).get_full_name()
                docid = doc.get('_id')
                if hasSearchPermission(user_id, doc.get('_source').get('doc_type'), docid):
                    # document = Documents.objects.get(id=doc.get('_id'))
                    # filepath = document.filepath
                    # ---- version upload latest file bug fix----
                    parent_id = Documents.objects.filter(parent=doc.get('_id'))
                    if parent_id:
                        latestfile = Documents.objects.filter(parent_id=doc.get('_id')).order_by('-version').first()
                    else:
                        latestfile = Documents.objects.get(id=docid)
                    #print("hi",Documents.objects.filter(id=doc.get('_id')).first())
                    filepath = latestfile.filepath
                    if latestfile.watermark != '0':
                        filepath = latestfile.watermark_file_path
                    # to handle un-supported files
                    # if filepath.find('workflow') == -1:
                    #     Elastic.delete(doc.get('_id'))
                    #     continue

                    # filepath = filepath.split('/workflow').pop(1)

                    source = doc.get('_source')
                    extention = mimetypes.guess_extension(source.get('extension'))
                    try:
                        docTypes = Category.objects.get(id=source.get('doc_type'))
                        docTypes = docTypes.get_ancestors(ascending=False, include_self=True)
                        docType = '->'.join([str(i) for i in docTypes])
                    except:
                        docType = ''

                    source.update({
                        'doc_type': docType,
                        'doc_type_id': source.get('doc_type'),
                        'filepath': filepath,
                        'extension': extention,
                        'mime_type': source.get('extension'),
                        'id': doc.get('_id'),
                        'score': doc.get('_score'),
                        'lockecd_by_name': locked_by
                    })
                    doc.update(source)
                    doc.__delitem__('_id')
                    doc.__delitem__('_index')
                    doc.__delitem__('_type')
                    doc.__delitem__('_score')
                    doc.__delitem__('_source')
                    search.append(doc)
                else:
                    count -= 1

            except Documents.DoesNotExist:
                count -= 1
                Elastic.delete(doc.get('_id'))

        result.update({
            'recordsTotal': count,
            'recordsFiltered': search.__len__(),
            'data': search
        })
        result.__delitem__('hits')
        result.__delitem__('total')
        return result

    def delete(id):
        s = Dms.get(id=id)
        try:
            s.delete()
        except Exception as ex:
            print(ex)

    def filename(value):
        return Q("match", filename=value)

    def metas(value):
        metas = []
        for v in value:
            if value[v]:
                # metas[v] = value[v]
                var = "metas." + v + '.keyword'
                m = Q({'term': {var: value[v]}})
                metas.append(m)

        # Q("multi_match", query='Email', fields=['metas.email'])
        # Q("match", metas='{"gender":"Female"}')
        # Q("multi_match", query='email', fields=['metas.email']) & Q("multi_match", query='Name', fields=['metas.name'])
        return metas

    def doc_type(value):
        return Q("term", doc_type=value)

    def expiry_date(value):
        return Q("match", expiry_date=value)

    def shelf_number(value):
        return Q("match", shelf_number=value)

    def box_number(value):
        return Q("match", box_number=value)

    def tags(value):
        return Q("terms", tags=value)

    def creation_date(value):
        return Q("match", creation_date=value)


connection.create()


class Dms(DocType):
    filename = Text()
    creation_date = Date()
    created_at = Date()
    expiry_date = Date()
    action_upon_expiry = int
    published = Boolean()
    locked = Boolean()
    locked_by = int
    locked_at = Date()
    archived = Boolean()
    archived_by = int
    archived_at = Date()
    deleted = Boolean()
    deleted_by = int
    deleted_at = Date()
    watermark = int
    watermarked_by = int
    box_number = Text(),
    shelf_number = Text(),
    encryption = Boolean()
    version = float
    uploaded_at = Date()
    doc_type = int
    parent = int
    uploader = Text()
    uploader_id = int
    version_uploader = int
    thumbnail = Text()
    extension = Text()
    category = Text(
        analyzer=html_strip,
        fields={'raw': Keyword()}
    )

    metas = Nested(
        properties={
            'created_at': Date()
        }
    )

    comments = Nested(
        doc_class=Comment,
        properties={
            'author': Text(fields={'raw': Keyword()}),
            'content': Text(analyzer='snowball'),
            'created_at': Date()
        }
    )

    class Meta:
        index = licensed.DMS_SEARCH_INDICES
        doc_type = 'document'

    def add_comment(self, author, content):
        self.comments.append(
            {'author': author, 'content': content})

    def add_meta_data(self, data):
        self.metas.append(data)

    def save(self, **kwargs):
        print("first.save", kwargs)
        self.created_at = datetime.now()
        print("created at",  self.created_at)
        return super().save(**kwargs)

    def close(**kwargs):
        i = Index(Dms._doc_type.index)
        i.close()

    def open(**kwargs):
        i = Index(Dms._doc_type.index)
        i.open()

    def exists(**kwargs):
        i = Index(Dms._doc_type.index)
        return i.exists(**kwargs)
