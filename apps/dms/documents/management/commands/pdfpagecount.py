import os
from PyPDF2.pdf import PdfFileReader
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError

from apps.dms.documents.models import Documents


class Command(BaseCommand):
    help = 'Count the pages of pdf files and save it to database'

    def handle(self, *args, **options):
        documents = Documents.objects.filter(pages=None, extension='application/pdf')

        for document in documents:
            path = default_storage.path(document.filepath)

            if path.endswith('.pdf'):
                cmd = "pdfinfo %s | grep 'Pages' | awk '{print $2}'" % path
                pages = os.popen(cmd).read().strip()
                print(pages)
                document.pages = pages
                document.save()
