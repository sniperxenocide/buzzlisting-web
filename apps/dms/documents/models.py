import shutil
import uuid

import time
from django.db import models
# from django.contrib.auth.models import User
from apps.core.rbac.models import User, Role, Permission
from apps.dms.api.category.models import Category
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.postgres.fields import JSONField

from apps.workflow.bpmn.models import Application


class TempRepository(models.Model):
    # id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    document = models.FileField(upload_to='tempfiles')
    name = models.CharField(max_length=250, null=True)
    thumbnail = models.ImageField(upload_to='thumbnail', blank=True, null=True)
    extension = models.CharField(max_length=500, null=True)
    creator = models.ForeignKey(User, related_name='creator')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    attached = models.BooleanField(default=False)
    excel_file_path = models.CharField(max_length=500, null=True, blank=True)
    # slug = models.SlugField(max_length=255)

    # def save(self, *args, **kwargs):
    #     print('saved called...')
    #     thumbnail = "thumbnail/%s.png" % (self.slug)
    #     self.thumbnail = thumbnail
    #     super(TempRepository, self).save(*args, **kwargs)
    #     print ('Saved called end')
    #
    # def __unicode__(self):
    #     return self.name


# @receiver(post_save,sender=TempRepository)
# def genthumbnail_post_save(sender, instance = False, created=False,  **kwargs):
#         if created:
#             print('post_save method called')
#             print(instance.document)
#             print(instance.thumbnail)
#             print("%s -thumbnail 222 %s/%s[0] %s/%s" % (
#             settings.CONVERT_BINARY, settings.MEDIA_ROOT, instance.document, settings.MEDIA_ROOT, instance.thumbnail))
#             command = "%s -quality 95 -thumbnail 222 %s/%s[0] %s/%s" % (
#             settings.CONVERT_BINARY, settings.MEDIA_ROOT, instance.document, settings.MEDIA_ROOT, instance.thumbnail)
#             # time.sleep(2)
#
#             print((subprocess.Popen(command,
#                                   shell=True,
#                                   stdin=subprocess.PIPE,
#                                   stdout=subprocess.PIPE,
#                                   stderr=subprocess.PIPE,
#                                   )).communicate())
#
#         else:
#             print("Gen Thumbnail function Not called ........")


@receiver(post_delete, sender=TempRepository)
def photo_post_delete_handler(sender, **kwargs):
    print('Post delete function called...')
    obj = kwargs['instance']
    try:
        storage, path = obj.document.storage, obj.document.path
        storage.delete(path)
    except:
        pass


class DocumentsManager(models.Manager):
    def all(self):
        queryset = self.get_queryset().filter(deleted=False, published=True)
        return queryset

    def filter(self, *args, **kwargs):
        # archived = False
        deleted = False
        published = True

        if kwargs.get('archived'):
            archived = kwargs.get('archived')

        if kwargs.get('deleted'):
            deleted = kwargs.get('deleted')

        if kwargs.get('published'):
            published = kwargs.get('published')

        kwargs.update(
            {
                # "archived": archived,
                "deleted": deleted,
                "published": published
            }
        )
        queryset = self.get_queryset().filter(*args, **kwargs)
        return queryset


class Documents(models.Model):
    uploader = models.ForeignKey(User, related_name='uploader')
    filename = models.CharField(max_length=250)
    filepath = models.FilePathField(path='/workflow/media/', max_length=255)
    creation_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    action_upon_expiry = models.PositiveSmallIntegerField(default=0,
                                                          choices=((0, 'None'), (1, 'Archive'), (2, 'Delete')))
    doc_type = models.ForeignKey(Category, null=False, blank=False)
    metadata = models.TextField(default='', null=False, blank=False)
    box_number = models.CharField(null=True, blank=True, max_length=50)
    shelf_number = models.CharField(null=True, blank=True, max_length=50)
    source = models.CharField(default='dms', null=False, blank=False, max_length=20)
    app = models.ForeignKey(Application, default='', null=True, blank=True)
    tags = models.TextField(default='', null=True, blank=True)
    extension = models.CharField(max_length=500)
    version = models.FloatField(default=1.0)
    uploaded_at = models.DateTimeField(auto_now_add=True, editable=True)

    # file = models.FileField(upload_to='repo')
    locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(User, related_name='lockedby', null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    edited_by = models.ForeignKey(User, related_name='edited_by', null=True, blank=True)

    archived = models.BooleanField(default=False)
    archived_by = models.ForeignKey(User, related_name='archivedby', null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, related_name='deletedby', null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    # watermark
    watermark = models.CharField(
        choices=(('0', 'None'), ('1', 'Approved'), ('2', 'Classified'), ('3', 'Confidential'), ('4', 'Rejected'),
                 ('5', 'Free Text')),
        default=0, max_length=50)
    watermark_file_path = models.FilePathField(path='/workflow/media/', max_length=255, null=True, blank=True)
    watermarked_by = models.ForeignKey(User, related_name='watermarkedby', null=True, blank=True)
    watermarked_at = models.DateTimeField(null=True, blank=True)
    version_uploader = models.ForeignKey(User, related_name='version_uploader', null=True, blank=True)
    parent = models.ForeignKey('self', null=True, default=None, blank=True)
    published = models.BooleanField(default=True)

    encryption = models.BooleanField(default=False, blank=True)

    thumbnail = models.CharField(default='', max_length=255)
    pages = models.BigIntegerField(null=True)

    redacted_user = models.ManyToManyField(User, blank=True, related_name='redacted_users')
    redacted_by = models.ForeignKey(User, related_name='redactedby', null=True, blank=True)

    annotations = models.TextField(null=True, blank=True)
    redactions = models.TextField(null=True, blank=True)
    objects = DocumentsManager()

    def delete(self, *args, **kwargs):
        super(Documents, self).delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        super(Documents, self).save(*args, **kwargs)

    def soft_del(self):
        self.deleted = True
        self.save()

    class Meta:
        unique_together = (("parent", "version", "deleted_at"),)


class MetaDocumentJson(models.Model):
    meta_json = JSONField(blank=True, null=True)
    doc_id = models.ForeignKey(Documents, related_name='doc_id', null=True, blank=True)

    def __str__(self):
        return '{}'.format(self.doc_id.id)


class DownloadSearchResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.ForeignKey)
    path = models.FilePathField()
    created_at = models.DateTimeField(auto_now_add=True)


# @receiver(post_delete, sender=Documents)
# def post_delete_handler(sender, **kwargs):
#     print ('Post Document delete function called...')
#     obj = kwargs['instance']
#     try:
#         storage, path = obj.filepath.storage, obj.filepath.path
#         storage.delete(path)
#     except Exception as ex:
#         print(ex)
#         pass

class LinkedFiles(models.Model):
    sourcefile = models.ForeignKey(Documents, on_delete=models.CASCADE, related_name='sourcefile')
    linkfile = models.ForeignKey(Documents, on_delete=models.CASCADE, related_name='linkedfile')
    attach_date = models.DateTimeField(auto_now_add=True)
    attach_by = models.ForeignKey(User, related_name='attacher', null=True, blank=True)
    deleted = models.BooleanField(default=False)

    def soft_del(self):
        self.deleted = True
        self.save()


class Comments(models.Model):
    document = models.ForeignKey(Documents, on_delete=models.CASCADE, related_name='document')
    commentor = models.ForeignKey(User, related_name='commentor')
    comment = models.TextField(default='', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted = models.BooleanField(default=False)

    def soft_del(self):
        print('soft del called')
        self.deleted = True
        self.save()

        # def __str__(self):
        #     return self.document.id


#
#
# class Pdf(models.Model):
#     """Pdf class"""
#     title = models.CharField(
#         verbose_name = _(u'Title'),
#         help_text = _(u'Commentary Title'),
#         max_length = 255
#     )
#     slug = models.SlugField(
#         verbose_name = _(u'Slug'),
#         help_text = _(u'The unique uri component for this commentary'),
#         max_length = 255,
#         unique = True
#     )
#     document = models.FileField(
#         verbose_name = _(u'The Pdf'),
#         help_text = _(u'Upload a pdf document.'),
#         upload_to = 'uploads/pdfs/'
#     )
#     thumbnail = models.ImageField(
#         verbose_name = _(u'Thumbnail'),
#         help_text = _(u'The thumbnail'),
#         upload_to = 'uploads/pdfs/',
#         blank = True,
#         null = True
#     )
#
#     def save(self, *args, **kwargs):
#         thumbnail = "uploads/pdfs/%s.png" % (self.slug,)
#         self.thumbnail = thumbnail
#         super(Pdf, self).save(*args, **kwargs)
#
#     def __unicode__(self):
#         return self.title
#
# # What to do after a PDF is saved
# print('calling post_save')
# @receiver(post_save, sender=Pdf)
# def pdf_post_save(sender, instance=False, **kwargs):
#     """This post save function creates a thumbnail for the commentary PDF"""
#     #pdf = Pdf.objects.get(pk=instance.pk)
#     print ('post_save method called')
#     print(instance.document)
#     print(instance.thumbnail)
#     print("%s -thumbnail 222 %s/%s[0] %s/%s" % (settings.CONVERT_BINARY,settings.MEDIA_ROOT, instance.document, settings.MEDIA_ROOT, instance.thumbnail))
#     command = "%s -quality 95 -thumbnail 222 %s/%s[0] %s/%s" % (settings.CONVERT_BINARY,settings.MEDIA_ROOT, instance.document, settings.MEDIA_ROOT, instance.thumbnail)
#    # time.sleep(2)
#     proc = subprocess.Popen(command,
#         shell=True,
#         stdin=subprocess.PIPE,
#         stdout=subprocess.PIPE,
#         stderr=subprocess.PIPE,
#     )
#     stdout_value = proc.communicate()
#     print('Convert output: ........')
#     print(stdout_value)
#


class SaveSearch(models.Model):
    search_name = models.CharField(null=False, blank=False, max_length=500)
    docName = models.CharField(null=True, blank=True, max_length=200)
    user = models.ForeignKey(User)
    DocumentType = models.IntegerField(null=True, blank=True)
    doccreated = models.DateField(null=True, blank=True)
    docexpired = models.DateField(null=True, blank=True)
    box_number = models.CharField(null=True, blank=True, max_length=200)
    shelf_number = models.CharField(null=True, blank=True, max_length=200)
    tags = models.TextField(default='', null=True, blank=True)
    metadata = models.TextField(default='', null=True, blank=True)
    archived = models.BooleanField(default=False)
    match = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class WaterMarkFiles(models.Model):
    name = models.CharField(null=False, blank=False, max_length=100)
    file = models.FileField(upload_to='watermark', null=False, blank=False)
    value = models.IntegerField(default=0)
