from __future__ import unicode_literals

import json
import random
import uuid

import time
from closuretree import models
from django.conf import settings
from django.db import models

from apps.core.rbac.models import User, Group

from django.utils import timezone

from apps.dms.api.department.models import Department


class Category(models.Model):
    name = models.CharField(max_length=50, blank=False, null=False)

    def __str__(self):
        return self.name


class Project(models.Model):
    title = models.CharField(max_length=60, blank=False, null=False, unique=True)
    description = models.TextField(max_length=600, blank=True, null=True)
    diagram = models.TextField(blank=True)
    published = models.BooleanField(default=False)
    category = models.ForeignKey(Category, null=True, on_delete=models.CASCADE)
    assigned_user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False,
                                      related_name='project_assigned_user')
    supervisors = models.ManyToManyField(User, related_name='project_supervisors', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    recheck = models.IntegerField(choices=(
        (1, 'flow forward'), (2, 'resume forward'),),
        default=1
    )

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.clean()
        return super(Project, self).save(*args, **kwargs)

    def clean(self):
        if self.title is not None:
            self.title = " ".join(self.title.split())


class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, blank=False, null=False)
    process = models.CharField(max_length=100, blank=False, null=False)
    element_id = models.CharField(max_length=100, blank=False, null=False)
    type = models.CharField(max_length=50, blank=False, null=False)
    name = models.TextField(null=True, blank=True)
    duration = models.FloatField(blank=False, null=False, default=24)
    delay = models.CharField(max_length=4, blank=True, null=True)
    time_unit = models.CharField(max_length=10, blank=True, null=False,
                                 choices=(('0', 'hour'), ('1', 'day'), ('2', 'week'), ('3', 'month'),), default=1)
    alert = models.BooleanField(default=False)
    user = models.ManyToManyField(User, related_name='users_task', blank=True)
    group = models.ManyToManyField(Group, blank=True)
    status = models.CharField(max_length=10, blank=True, null=True)
    start = models.BooleanField(default=False)
    assignment_type = models.IntegerField(choices=(
        (0, 'cyclic assignment'), (1, 'manager assignment'), (2, 'manual assignment'), (3, 'self service'),),
        default=0
    )
    rules_applied = models.BooleanField(default=False)

    def __str__(self):
        return '{} ({})'.format(self.project, self.name)

    def get_users(self):
        return ",".join([str(p) for p in self.user.all()])


class TaskRule(models.Model):
    condition = models.TextField(null=False, blank=False)
    task = models.ForeignKey(Task, related_name='task_based_rules', blank=False)
    user = models.ForeignKey(User, blank=False, related_name='user_rules')

    def __str__(self):
        return '{}'.format(self.condition)


class Route(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    process = models.CharField(max_length=100, blank=False, null=False)
    name = models.TextField(null=True, blank=True)
    condition = models.TextField(null=True, blank=True, default=None)
    source = models.ForeignKey(Task, on_delete=models.CASCADE, blank=True, null=True, related_name='source')
    target = models.ForeignKey(Task, on_delete=models.CASCADE, blank=True, null=True, related_name='target')
    type = models.CharField(max_length=50, blank=False, null=False)
    email = models.BooleanField(default=False)

    def __str__(self):
        return 'source - {}, target - {}'.format(self.source.name, self.target.name)


class Template(models.Model):
    project = models.ForeignKey(Project)
    file_name = models.CharField(max_length=200, null=False, blank=False)
    location = models.CharField(max_length=1000, blank=True)

    def __str__(self):
        return self.file_name

    class Meta:
        unique_together = (('project', 'file_name'),)


class OutputDocument(models.Model):
    project = models.ForeignKey(Project)
    title = models.CharField(max_length=200, null=False, blank=False)
    generated_name = models.CharField(max_length=200, null=False, blank=False)
    description = models.TextField(blank=True)
    template = models.ForeignKey(Template)
    version = models.BooleanField(default=False)
    download = models.BooleanField(default=True)

    class Meta:
        unique_together = (('project', 'title'), ('project', 'generated_name'))


class EForm(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, editable=False, blank=True, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, blank=False, null=False)
    type = models.CharField(blank=True, null=True, max_length=50)
    filename = models.CharField(blank=True, null=True, max_length=200)
    content = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, default='')
    title = models.CharField(blank=False, null=False, max_length=120)
    version = models.CharField(blank=True, null=True, max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)
    variables_id = models.TextField(blank=True, null=True)

    def __str__(self):
        return '{}'.format(self.title)

    def save(self, *args, **kwargs):
        self.clean()
        if self.content is not None:
            variable_list = []
            content = json.loads(self.content)
            for row in content['items'][0]['items']:
                for columns in row:
                    if 'id' in columns and columns['id'] not in variable_list:
                        variable_list.append(columns['id'])
            self.variables_id = json.dumps(variable_list)
        return super(EForm, self).save(*args, **kwargs)

    def clean(self):
        if self.title is not None:
            self.title = " ".join(self.title.split())


class Variable(models.Model):
    project = models.ForeignKey(Project, related_name='variable')
    name = models.CharField(max_length=120, blank=False, null=False)
    type = models.CharField(choices=(
        ('string', 'string'), ('integer', 'integer'), ('float', 'float'), ('boolean', 'boolean'),
        ('datetime', 'datetime'),
        ('grid', 'grid'), ('array', 'array'), ('file', 'file'),), max_length=120, blank=False, null=False)
    size = models.CharField(max_length=100, null=True, blank=True)
    default = models.TextField(null=True, blank=True)
    accepted_defaults = models.TextField(null=True, blank=True)


class Script(models.Model):
    file_name = models.CharField(max_length=200, null=True, blank=False, unique=True)
    reference_name = models.CharField(max_length=200, null=True, blank=False, unique=True)


class EmailTemplates(models.Model):
    file_name = models.CharField(max_length=200, null=True, blank=False, unique=True)
    reference_name = models.CharField(max_length=200, null=True, blank=False, unique=True)


class Step(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='step')
    type = models.IntegerField(choices=((0, 'eForm'), (1, 'script'), (2, 'output_document'),), null=False, blank=False)
    eform = models.ForeignKey(EForm, on_delete=models.CASCADE, null=True)
    output_document = models.ForeignKey(OutputDocument, on_delete=models.CASCADE, null=True)
    script = models.ForeignKey(Script, on_delete=models.CASCADE, null=True)
    condition = models.TextField(null=True, blank=True)
    position = models.IntegerField(null=False, blank=False)
    mode = models.IntegerField(choices=((0, 'edit'), (1, 'view'),), null=False, blank=False)

    class Meta:
        unique_together = (("position", "task"),)

    def __str__(self):
        return 'task-{}, type-{}, position-{}'.format(self.task, self.type, self.position)


def unique_id():
    return random.randint(1, 9999999999)


class Application(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    process = models.CharField(max_length=200, blank=False, null=False, default='')
    number = models.CharField(null=False, blank=False, default=unique_id, max_length=1000)
    status = models.IntegerField(null=False, blank=False, default=None,
                                 choices=((0, 'completed'), (1, 'todo'), (2, 'open'),))
    init_user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='init_user')
    current_user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='current_user')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    data = models.TextField(null=False, blank=False)
    duration = models.DateTimeField(null=True, blank=True)
    delay = models.DateTimeField(null=True, blank=True)
    out_open = models.BooleanField(default=False)

    def __str__(self):
        return '{}'.format(self.number)


class BacktrackRoute(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    backtrack_path = models.TextField(blank=True, null=True)


class Delegation(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    process = models.CharField(max_length=100, null=False, blank=True, db_index=True)
    task = models.ForeignKey(Task, related_name='task_delegations')
    sent_task = models.ForeignKey(Task, related_name='sent_task_delegations', null=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='delegation')
    user = models.ForeignKey(User, related_name='delegation_user')
    sent_by = models.ForeignKey(User, related_name='delegation_sent_by', null=True)
    status = models.IntegerField(null=False, blank=False,
                                 choices=(
                                     (0, 'completed'), (1, 'todo'), (2, 'open'), (3, 'non claimed'), (4, 'reassigned')))
    additional_status = models.IntegerField(null=True, blank=True, choices=((0, 'reject'), (1, 'recheck')))
    init_date = models.DateTimeField(auto_now_add=True, db_index=True)
    update_date = models.DateTimeField(auto_now=True, db_index=True)
    finish_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(db_index=True)
    risk_date = models.DateTimeField(default=timezone.now, db_index=True)
    index_pos = models.PositiveIntegerField(null=False, blank=False, default=0)
    routing_type = models.IntegerField(choices=((0, 'sequential'), (1, 'parallel')), default=0)
    is_recheck = models.BooleanField(default=False)
    is_delegated = models.BooleanField(default=False)
    actual_task_user = models.ForeignKey(User, null=True)

    def __str__(self):
        return 'task-{}, app_num-{}, user-{}'.format(self.task.name, self.application.number, self.user.get_full_name())


class EformHistory(models.Model):
    delegation = models.ForeignKey(Delegation, on_delete=models.CASCADE)
    data = models.TextField(null=False, blank=False)

    def __str__(self):
        return 'id-{},data-{}'.format(self.pk,self.data)


def input_doc_dir(instance, filename):
    return 'input_doc/{}/{}/{}'.format(time.strftime("%Y/%m/%d"), instance.user.username, filename)


class InputDocument(models.Model):
    project = models.ForeignKey(Project, related_name='project_input_doc', on_delete=models.CASCADE)
    process = models.CharField(max_length=200, null=False, blank=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_input_doc')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='app_input_doc')
    size = models.CharField(max_length=200, blank=False, null=False)
    name = models.CharField(max_length=300, blank=False, null=False)
    extension = models.CharField(max_length=100, blank=False, null=False)
    file = models.FileField(upload_to=input_doc_dir, default='')
    user = models.ForeignKey(User)
    variable = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    attached = models.BooleanField(default=False)


def generated_document_dir(instance, filename):
    return 'generated_document/{}/{}'.format(instance.application.number, filename)


class GeneratedDocument(models.Model):
    application = models.ForeignKey(Application)
    file_name = models.CharField(max_length=200, null=False, blank=False)
    location = models.FileField(upload_to=generated_document_dir)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    download = models.BooleanField(default=True)


# class Supervisor(models.Model):
#     project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='supervisors')
#     user = models.ManyToManyField(User, blank=False)


class AppComment(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='application_comment')
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField(blank=False, null=False)
    date = models.DateTimeField(auto_now=True)


class AppQuery(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='application_query')
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    delegation = models.ForeignKey(Delegation, on_delete=models.CASCADE, blank=True, null=True)
    user_from = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_from')
    user_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_to')
    query = models.TextField(blank=False, null=False)
    query_answer = models.TextField(blank=True, null=True)
    date = models.DateField(auto_now=True)
    is_answered = models.BooleanField(default=False)
    expiry_date = models.DateField('expiry_date', null=True, blank=True)
    answer_date = models.DateField('answer_date', null=True, blank=True)

    def __str__(self):
        return '{}'.format(self.pk)


class Weekend(models.Model):
    day = models.IntegerField(
        choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'),
                 (6, 'Sunday')],
        unique=True
    )


class Holiday(models.Model):
    date = models.DateField(blank=False, null=False, unique=True)
    description = models.TextField(null=False, blank=False)
