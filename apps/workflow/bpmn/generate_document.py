import json

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.template import Template, Context
from weasyprint import HTML

from .models import GeneratedDocument


class GenerateDocument(object):
    def __init__(self, output_doc, application):
        self.output_doc, self.application = output_doc, application

    def generate_pdf(self):
        template = Template(default_storage.open(self.output_doc.template.location).read())
        context = Context(json.loads(self.application.data))
        html_string = '''
        <style>
        # table { border-collapse: collapse }
        td    { border-bottom: 1px solid black; vertical-align: top }
        # thead {display: table-header-group}
        # tfoot {display: table-row-group}
        tr {
            page-break-inside: avoid !important;
        }
        # html,body{
        #      margin: 0;
        #      padding: 0;
        #      height: 100%;
        #      word-wrap:break-word;
        #     }
        # @page {
        #   size: a4 portrait;
        #   margin: 0;
        #   padding: 0;
        # }
        # .single-page{
        #   # page-break-after: always;
        #   padding: 0;
        #   margin: 0;
        #   display: block;
        #   border:10px dotted lightslategrey;
        # }
        # .half-page{
        #   margin: 0;
        #   height: 50%;
        #   position: relative;
        #   padding: 1cm;
        # }
        </style>''' + str(template.render(context))
        pdf_file = HTML(string=html_string).write_pdf()
        GeneratedDocument.objects.create(**{
            'application': self.application,
            'file_name': self.output_doc.generated_name,
            'location': SimpleUploadedFile(self.output_doc.generated_name + '.pdf', pdf_file,
                                           content_type='application/pdf'),
            'download': self.output_doc.download
        })
        return True
