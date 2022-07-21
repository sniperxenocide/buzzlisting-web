import django
django.setup()
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.core.mail import get_connection, EmailMultiAlternatives
from django.db import connection
from django.template.loader import render_to_string
from apps.workflow.bpmn.models import *


class ScriptLibrary(object):
    def __init__(self, app_data, task_id):
        self.app_data = app_data
        self.task_id = task_id


    def execute_query(self, query):
        # this function executes query
        print("==> From execute_query(self, query):\n")
        result = None
        if query!= "" and query is not None:
            query_type = query.split()
            if query_type[0].lower() != "select":
                print("==> You are not permitted to execute any query other than SELECT.\n")

            else:
                with connection.cursor() as cursor:
                    cursor.execute(query)
                    columns = [col[0] for col in cursor.description]
                    result = [
                        dict(zip(columns, row))
                        for row in cursor.fetchall()
                        ]
        else:
            print("==> Empty query can not be executed.\n")
        print("==> execute_query(self, query) done...\n\n")
        return result



    def generate_template(self, file_name):
        # this function generates final template by replacing variable values in the html file
        print("==> From generate_template(self, file_name, app_data):\n")
        html_content = None
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                        if self.app_data is not None:
                            html_content = render_to_string('workflow/script//email_templates/' + r.reference_name,
                                                            {'USERNAME': self.app_data['USERNAME'],
                                                             'APP_ID': self.app_data['APP_ID'],
                                                             'PROJECT': self.app_data['PROJECT'],
                                                             'USER_ID': self.app_data['USER_ID'],
                                                             'TASK': self.app_data['TASK'],
                                                             'PROCESS': self.app_data['PROCESS'],
                                                             'APP_NUMBER': self.app_data['APP_NUMBER']})

                            print("==> Template:\n" + html_content + "\n\n")

                        else:
                            print("==> app_data is empty.\n")


                    else:
                        print("==> There is no file named %s.\n" % file_name)
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")


        print("==> generate_template(self, file_name, app_data)...\n\n")
        return html_content


    def ssend_mail(self, subject, body):
        # this function send smtp mail to the users assigned to next user
        print("==> From ssend_mail(self, task_id, subject, body):\n")
        username = "infosapex2@gmail.com"
        password = 'info123456'
        if self.task_id is not None:
            task = Task.objects.get(id=self.task_id)
            if task is not None:
                target_task = Route.objects.filter(project=task.project, process=task.process, source=task)
                if subject != "" and body != "":
                    next_target = 0
                    next_user = 0
                    for t in target_task:
                        next_target = 1
                        target = t.target
                        next_user = target.user.all()
                        for u in next_user:
                            next_user = 1
                            msg = MIMEMultipart()
                            msg['From'] = username
                            msg['To'] = u.email
                            msg['Subject'] = subject
                            msg.attach(MIMEText(body, 'plain'))
                            server = smtplib.SMTP('smtp.gmail.com', 587)
                            server.starttls()
                            server.login(username, password)
                            text = msg.as_string()
                            server.sendmail(username, u.email, text)
                            server.quit()
                            print("==> Mail sent.\n")
                    if next_target == 0:
                        print("==> No target task. Mail not sent.\n")
                    else:
                        if next_user == 0:
                            print("==> No next user. Mail not sent.\n")

                else:
                    print("==> both subject and body are required. Mail not sent.\n")

            else:
                print("==> Task not found.\n")
        else:
            print("==> Task not found.\n")
        print("==> ssend_mail(self, task_id, subject, body) done...\n\n")



    def send_memail(self, username, password, receiver, subject, body):
        # send SMTP mail to designated user
        print("==> From send_memail(self, username, password, receiver, subject, body):\n")
        if username is not None:
            if password is not None:
                if receiver is not None:
                    if subject is not None and subject != "":
                        if body is not None and body != "":
                            msg = MIMEMultipart()
                            msg['From'] = username
                            msg['To'] = receiver
                            msg['Subject'] = subject
                            msg.attach(MIMEText(body, 'plain'))
                            server = smtplib.SMTP('smtp.gmail.com', 587)
                            server.starttls()
                            server.login(username, password)
                            text = msg.as_string()
                            server.sendmail(username, receiver, text)
                            server.quit()
                            print("==> Mail sent.\n")
                        else:
                            print("==> Email body missing. Mail not sent.\n")
                    else:
                        print("==> Subject missing. Mail not sent\n")
                else:
                    print("==> Receiver not found. Mail not sent\n")
            else:
                print("==> Password Required. Mail not sent\n")
        else:
            print("==> username required. Mail not sent.\n")
        print("==> send_memail(self, username, password, receiver, subject, body) done...\n\n")



    def mail(self, email, subject, file_name, attached_file):
        # send mail using django mail service to designated user
        From = "infosapex2@gmail.com"
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                        if email is not None:
                            if self.app_data is not None:
                                if subject is not None and subject != "":
                                    connection = get_connection()  # uses SMTP server specified in settings.py
                                    connection.open()  # If connection is not manually opened, Django will automatically open, then tear down the connection in msg.send()

                                    html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                    {'USERNAME': self.app_data['USERNAME'],
                                                                     'APP_ID': self.app_data['APP_ID'],
                                                                     'PROJECT': self.app_data['PROJECT'],
                                                                     'USER_ID': self.app_data['USER_ID'],
                                                                     'TASK': self.app_data['TASK'],
                                                                     'PROCESS': self.app_data['PROCESS'],
                                                                     'APP_NUMBER': self.app_data['APP_NUMBER']})
                                    text_content = "..."
                                    msg = EmailMultiAlternatives(subject, text_content, From, [email],
                                                                 connection=connection)
                                    msg.attach_alternative(html_content, "text/html")
                                    if attached_file is not None and attached_file != "":
                                        for a in attached_file:
                                            msg.attach_file(a)
                                    msg.send()
                                    connection.close()
                                    print("==> email sent.\n")
                                else:
                                    print("==> Email subject is required. Mail not sent.\n")
                            else:
                                print("==> app_data is empty. Mail not sent\n")
                        else:
                            print("==> Email address required. Mail not sent\n")
                    else:
                        print("==> There is no file named %s.\n" % file_name)
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")

        print("==> mail(self, email, app_data, subject, file_name) done...\n\n")




    def send_next_user(self, subject, file_name, attached_file):
        # send mail to users assigned to next task using django mail service
        print("==> From send_next_user(self, task_id, app_data, subject, file_name):\n")
        From = "infosapex2@gmail.com"
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                        if self.task_id is not None and self.task_id != "":
                            if self.app_data is not None:
                                if subject is not None and subject != "":
                                    task = Task.objects.get(id=self.task_id)
                                    if task is not None:
                                        target_task = Route.objects.filter(project=task.project, process=task.process,
                                                                           source=task)
                                        next_target = 0
                                        next_user = 0
                                        for t in target_task:
                                            next_target = 1
                                            target = t.target
                                            next_user = target.user.all()
                                            for u in next_user:
                                                next_user = 1
                                                connection = get_connection()  # uses SMTP server specified in settings.py
                                                connection.open()  # If you don't open the connection manually, Django will automatically open, then tear down the connection in msg.send()
                                                html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                                {'USERNAME': self.app_data['USERNAME'],
                                                                                 'APP_ID': self.app_data['APP_ID'],
                                                                                 'PROJECT': self.app_data['PROJECT'],
                                                                                 'USER_ID': self.app_data['USER_ID'],
                                                                                 'TASK': self.app_data['TASK'],
                                                                                 'PROCESS': self.app_data['PROCESS'],
                                                                                 'APP_NUMBER': self.app_data['APP_NUMBER']})
                                                text_content = '...'
                                                msg = EmailMultiAlternatives(subject, text_content, From, [u.email],
                                                                             connection=connection)
                                                msg.attach_alternative(html_content, "text/html")
                                                if attached_file is not None and attached_file != "":
                                                    for a in attached_file:
                                                        msg.attach_file(a)
                                                msg.send()
                                                connection.close()
                                                print("==> Email sent.\n")

                                        if next_target == 0:
                                            print("==> No target task. Mail not sent.\n")
                                        else:
                                            if next_user == 0:
                                                print("==> No next user. Mail not sent.\n")


                                else:
                                    print("==> Email subject missing. Mail not sent.\n")
                            else:
                                print("==> app_data empty. Mail not sent.\n")
                        else:
                            print("==> task_id not found. Mail not sent")

                    else:
                        print("==> There is no file named %s.\n" % file_name)
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")


        print("==> send_next_user(self, task_id, app_data, subject, file_name) done...\n\n")




    def send_superviser(self, subject, file_name, attached_file):
        print("==> From send_superviser(self, subject, file_name, attached_file):\n")
        From = "infosapex2@gmail.com"
        if self.task_id is not None:
            task = Task.objects.get(id = self.task_id)
            if task is not None:
                all_users = task.user.all()
                if all_users is not None:
                    au = 0
                    for a in all_users:
                        au = 1
                        if a.reports_to is not None:
                            To = a.reports_to.email
                        else:
                            print("==> superviser not found.\n")

                    if au == 0:
                        print("==> Task user not found.\n")
                else:
                    print("==> Task user not found.\n")
            else:
                print("==> Task not found.\n")
        else:
            print("==> Invalid task.\n")

        if To is not None:
            if subject is not None and subject != "":
                if file_name is not None and file_name != "":
                    refer_name = EmailTemplates.objects.filter(file_name=file_name)
                    flag = 0
                    if refer_name is not None:
                        for r in refer_name:
                            flag = 1
                            if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                                connection = get_connection()  # uses SMTP server specified in settings.py
                                connection.open()  # If you don't open the connection manually, Django will automatically open, then tear down the connection in msg.send()

                                html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                {'USERNAME': self.app_data['USERNAME'],
                                                                 'APP_ID': self.app_data['APP_ID'],
                                                                 'PROJECT': self.app_data['PROJECT'],
                                                                 'USER_ID': self.app_data['USER_ID'],
                                                                 'TASK': self.app_data['TASK'],
                                                                 'PROCESS': self.app_data['PROCESS'],
                                                                 'APP_NUMBER': self.app_data['APP_NUMBER']})
                                text_content = '...'
                                msg = EmailMultiAlternatives(subject, text_content, From, [To], connection=connection)
                                msg.attach_alternative(html_content, "text/html")
                                if attached_file is not None and attached_file != "":
                                    for a in attached_file:
                                        msg.attach_file(a)
                                msg.send()

                                connection.close()
                            else:
                                print("==> File not found.\n")
                        if flag == 0:
                            print("==> There is no file named %s.\n" % file_name)
                    else:
                        print("==> There is no file named %s.\n" % file_name)
                else:
                    print("==> Invalid file name.\n")
            else:
                print("==> Subject of email is required.\n")
        else:
            print("==> superviser Email address not found.\n")

        print("==> send_superviser(self, subject, file_name, attached_file) done...\n")




    def send_initiator(self, subject, file_name, attached_file):
        print("==> From send_initiator(self, task_id, app_data, subject, file_name):\n")
        From = "infosapex2@gmail.com"
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if self.app_data is not None:
                        app = Application.objects.get(id=self.app_data['APP_ID'])
                        if app is not None:
                            To = app.init_user.email
                            if To is not None and To != "":
                                if subject is not None and subject != "":
                                    if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                                        connection = get_connection()  # uses SMTP server specified in settings.py
                                        connection.open()  # If you don't open the connection manually, Django will automatically open, then tear down the connection in msg.send()

                                        html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                        {'USERNAME': self.app_data['USERNAME'],
                                                                         'APP_ID': self.app_data['APP_ID'],
                                                                         'PROJECT': self.app_data['PROJECT'],
                                                                         'USER_ID': self.app_data['USER_ID'],
                                                                         'TASK': self.app_data['TASK'],
                                                                         'PROCESS': self.app_data['PROCESS'],
                                                                         'APP_NUMBER': self.app_data['APP_NUMBER']})
                                        text_content = '...'
                                        msg = EmailMultiAlternatives(subject, text_content, From, [To],
                                                                     connection=connection)
                                        msg.attach_alternative(html_content, "text/html")
                                        if attached_file is not None and attached_file != "":
                                            for a in attached_file:
                                                msg.attach_file(a)
                                        msg.send()

                                        connection.close()
                                        print("==> Email sent.\n")
                                    else:
                                        print("There is no file named %s.\n" % file_name)
                                else:
                                    print("==> subject required. Mail not sent.\n")
                            else:
                                print("==> Receiver email address not found. Mail not sent.\n")
                        else:
                            print("==> No current application found. Mail not sent.\n")
                    else:
                        print("==> app_data is empty. Mail not sent.\n")
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")


        print("==> send_initiator(self, task_id, app_data, subject, file_name) done...\n\n")




    def send_participants(self, subject, file_name, attached_file):
        print("==> From send_participants(self, task_id, app_data, subject, file_name):\n")
        From = "infosapex2@gmail.com"
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if self.task_id is not None:
                        current_task = Task.objects.get(id=self.task_id)
                        if current_task is not None:
                            all_tasks = Task.objects.filter(project_id=current_task.project_id)
                            if all_tasks is not None:
                                at = 0
                                au = 0
                                for a in all_tasks:
                                    at = 1
                                    all_users = a.user.all()
                                    for u in all_users:
                                        au = 1
                                        To = u.email
                                        if To is not None and To != "":
                                            if self.app_data is not None:
                                                if subject is not None and subject != "":
                                                    if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                                                        connection = get_connection()  # uses SMTP server specified in settings.py
                                                        connection.open()  # If you don't open the connection manually, Django will automatically open, then tear down the connection in msg.send()
                                                        html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                                        {'USERNAME': self.app_data[
                                                                                            'USERNAME'],
                                                                                         'APP_ID': self.app_data['APP_ID'],
                                                                                         'PROJECT': self.app_data['PROJECT'],
                                                                                         'USER_ID': self.app_data['USER_ID'],
                                                                                         'TASK': self.app_data['TASK'],
                                                                                         'PROCESS': self.app_data['PROCESS'],
                                                                                         'APP_NUMBER': self.app_data[
                                                                                             'APP_NUMBER']})
                                                        text_content = '...'
                                                        msg = EmailMultiAlternatives(subject, text_content, From, [To],
                                                                                     connection=connection)
                                                        msg.attach_alternative(html_content, "text/html")
                                                        if attached_file is not None and attached_file != "":
                                                            for a in attached_file:
                                                                msg.attach_file(a)
                                                        msg.send()
                                                        connection.close()

                                                    else:
                                                        print("==> There is no file named %s.\n" % file_name)

                                                else:
                                                    print("==> email subject is missing. email not sent.\n")
                                            else:
                                                print("==> app_data empty. email not sent.\n")
                                        else:
                                            print("==> participant's email address not found. email not sent.\n")
                                if at == 0:
                                    print("==> no other tasks under this project. email not sent.\n")
                                else:
                                    if au == 0:
                                        print(
                                            "==> No users assigned to the tasks under this project. email not sent.\n")
                                    else:
                                        print("==> email sent.\n")
                            else:
                                print("==> No other task found under this project. email not sent.\n")
                        else:
                            print("==> current task not found.email not sent.\n")
                    else:
                        print("==> task_id invalid.\n")
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")


        print("==> send_participants(self, task_id, app_data, subject, file_name) done...\n")




    def send_previous_user(self, subject, file_name, attached_file):
        print("==> From send_previous_user(self, task_id, app_data, subject, file_name):\n")
        From = "infosapex2@gmail.com"
        if file_name is not None and file_name != "":
            refer_name = EmailTemplates.objects.filter(file_name=file_name)
            flag = 0
            if refer_name is not None:
                for r in refer_name:
                    flag = 1
                    if self.task_id is not None:
                        prev_task = Route.objects.filter(target_id=self.task_id)
                        if prev_task is not None:
                            prev_t = 0
                            prev_u = 0
                            for p in prev_task:
                                prev_t = 1
                                prev_user = p.source.user.all()
                                for u in prev_user:
                                    prev_u = 1
                                    To = u.email
                                    if To is not None and To != "":
                                        if os.path.exists('./templates/workflow/script/email_templates/' + r.reference_name):
                                            if self.app_data is not None:
                                                if subject is not None and subject != "":
                                                    connection = get_connection()  # uses SMTP server specified in settings.py
                                                    connection.open()  # If you don't open the connection manually, Django will automatically open, then tear down the connection in msg.send()

                                                    html_content = render_to_string('workflow/script/email_templates/' + r.reference_name,
                                                                                    {'USERNAME': self.app_data['USERNAME'],
                                                                                     'APP_ID': self.app_data['APP_ID'],
                                                                                     'PROJECT': self.app_data['PROJECT'],
                                                                                     'USER_ID': self.app_data['USER_ID'],
                                                                                     'TASK': self.app_data['TASK'],
                                                                                     'PROCESS': self.app_data['PROCESS'],
                                                                                     'APP_NUMBER': self.app_data[
                                                                                         'APP_NUMBER']})
                                                    text_content = '...'
                                                    msg = EmailMultiAlternatives(subject, text_content, From, [To],
                                                                                 connection=connection)
                                                    msg.attach_alternative(html_content, "text/html")
                                                    if attached_file is not None and attached_file != "":
                                                        for a in attached_file:
                                                            msg.attach_file(a)
                                                    msg.send()

                                                    connection.close()  # Cleanup

                                                else:
                                                    print("==> Email subject missing. Email not sent.\n")
                                            else:
                                                print("==> app_data not found. Email not sent.\n")

                                        else:
                                            print("==> There is no file named %s.\n" % file_name)
                                    else:
                                        print("==> Previous user's email address was not found. Email not sent.\n")
                            if prev_t == 0:
                                print("==> No previuos task. Email not sent.\n")
                            else:
                                if prev_u == 0:
                                    print("==> No previous users found.\n")
                                else:
                                    print("==> Email sent\n")
                        else:
                            print("==> No previuos task. Email not sent.\n")
                    else:
                        print("==> task_id invalid.\n")
                if flag == 0:
                    print("==> There is no file named %s.\n" % file_name)
            else:
                print("==> There is no file named %s.\n" % file_name)
        else:
            print("==> Invalid file name.\n")

        print("==> send_previous_user(self, task_id, app_data, subject, file_name) done...\n\n")

