import datetime
import json
import os
from collections import OrderedDict
from subprocess import PIPE, Popen

from django.http import Http404
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.utils.crypto import get_random_string
from requests import Response
from rest_framework import serializers
from rest_framework import status

from apps.workflow.bpmn.models import *

# Create your views here.
from conf.settings import MEDIA_URL, BASE_DIR


def start_scripting(request):
    files = Script.objects.all()
    return render(request, 'workflow/script/mod_script.html', {"files": files})


def write_script(request):
    if request.user.role.permission.filter(id=2).count():
        return render(request, 'workflow/script/save_script.html')
    else:
        files = Script.objects.all()
        return render(request, 'workflow/script/mod_script.html', {"files": files})


def validate_code(code):
    error_message = ""
    if len(code) is not 0:
        lines = code.splitlines()
        for i in lines:
            i = ''.join(i.split())
            print(i)
            # if "USERNAME=" in i:
            if i.find("USERNAME=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'USERNAME' as a variable.\n"
            elif i.find("APP_ID=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'APP_ID' as a variable.\n"
            elif i.find("PROJECT=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'PROJECT' as a variable.\n"
            elif i.find("USER_ID=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'USER_ID' as a variable.\n"
            elif i.find("TASK=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'TASK' as a variable.\n"
            elif i.find("PROCESS=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'PROCESS' as a variable.\n"
            elif i.find("APP_NUMBER=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'APP_NUMBER' as a variable.\n"
            elif i.find("task_id=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'task_id' as a variable.\n"
            elif i.find("app_id=", 0) == 0:
                error_message = error_message + "Error: The code contains keyword 'app_id' as a variable.\n"

    else:
        error_message = ""

    return error_message


def create_template(request):
    if request.user.role.permission.filter(id=2).count():
        return render(request, 'workflow/script/make_templates.html')
    else:
        files = Script.objects.all()
        return render(request, 'workflow/script/mod_script.html', {"files": files})


def save_template(request):
    if request.method == "POST":
        code = request.POST.get("content")
        file_name = request.POST.get("file_name")
        print(code)
        print(file_name)
        check = EmailTemplates.objects.filter(file_name=file_name)
        flag = 0
        for c in check:
            print(c.file_name)
            flag = 1
        error_message = ""

        if flag == 0:
            while True:
                reference_name = get_random_string(length=12,
                                                   allowed_chars=u'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + ".html"
                if not os.path.isfile("./scripts/workflow_script/all_scripts/" + reference_name):
                    break
            template_files = EmailTemplates(file_name=file_name, reference_name=reference_name)
            template_files.save()

            location = 'templates/workflow/script/email_templates'
            os.makedirs(location, exist_ok=True)
            new_file = location + '/' + reference_name
            f = open(new_file, 'w')
            f.write(code)
            f.close()


        else:
            error_message = "The file already exists"

    if error_message != "":
        return HttpResponse(content=error_message, status=404)
    else:
        return render(request, 'workflow/script/save_script.html')


def delete_files(request):
    if request.user.role.permission.filter(id=2).count():
        if request.method == "POST":
            file_name = request.POST.get("file_name")
            del_files = Script.objects.filter(file_name=file_name)
            for d in del_files:
                os.remove("./scripts/workflow_script/all_scripts/" + d.reference_name)
            del_files.delete()

        files = Script.objects.all()
        return render(request, 'workflow/script/scripting.html', {"files": files})
    else:
        files = Script.objects.all()
        return render(request, 'workflow/script/mod_script.html', {"files": files})


def modify_files(request):
    if request.user.role.permission.filter(id=2).count():
        code = ""
        file_name = ""
        if request.method == "POST":
            print("HELLO")
            file_name = request.POST.get("file_name")
            print(file_name)
            reference_name = Script.objects.filter(file_name=file_name)

            for r in reference_name:
                with open("./scripts/workflow_script/all_scripts/" + r.reference_name, 'r') as file:
                    code = code + file.read()
                    file.close()
                    temp_code = code.split("#Codes above are automatically generated. Do not modify them.\n\n\n\n")
                    code = temp_code[1]
            return render(request, 'workflow/script/modify_script.html', {"file_name": file_name, "code": code})
    else:
        files = Script.objects.all()
        return render(request, 'workflow/script/mod_script.html', {"files": files})


def save_modification(request):
    if request.method == "POST":
        code = request.POST.get("content")
        file_name = request.POST.get("file_name")
        reference_name = Script.objects.filter(file_name=file_name)
        imports = "from apps.workflow.script import macro_file\n" + "import sys\n" + "import json\n" + "#system arguments\n" + "task_id = sys.argv[1]\n" + "app_data = json.loads(sys.argv[2])\n" + "USERNAME = app_data['USERNAME']\n" + "APP_ID = app_data['APP_ID']\n" + "PROJECT = app_data['PROJECT']\n" + "USER_ID = app_data['USER_ID']\n" + "TASK = app_data['TASK']\n" + "PROCESS = app_data['PROCESS']\n" + "APP_NUMBER = app_data['APP_NUMBER']\n" + "mf = macro_file.ScriptLibrary(app_data, task_id)\n" + "#Codes above are automatically generated. Do not modify them.\n\n\n\n"
        code = imports + code
        for r in reference_name:
            with open("./scripts/workflow_script/all_scripts/" + r.reference_name, 'w') as file:
                file.write(code)
                file.close()
        files = Script.objects.all()
        return render(request, 'workflow/script/scripting.html', {"files": files})


def save_script(request):
    if request.method == "POST":
        code = request.POST.get("content")
        file_name = request.POST.get("file_name")
        message = validate_code(code)

        directory = "./scripts/workflow_script/all_scripts/"
        os.makedirs(os.path.dirname(directory), exist_ok=True)

        check = Script.objects.filter(file_name=file_name)
        flag = 0
        for c in check:
            flag = 1
            print(c.reference_name)
        error_message = ""

        if flag == 0:
            if message is "":
                while True:
                    reference_name = get_random_string(length=12,
                                                       allowed_chars=u'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + ".py"
                    if not os.path.isfile("./scripts/workflow_script/all_scripts/" + reference_name):
                        break
                script_files = Script(file_name=file_name, reference_name=reference_name)
                script_files.save()

                imports = "from apps.workflow.script import macro_file\n" + "import sys\n" + "import json\n" + "#system arguments\n" + "task_id = sys.argv[1]\n" + "app_data = json.loads(sys.argv[2])\n" + "USERNAME = app_data['USERNAME']\n" + "APP_ID = app_data['APP_ID']\n" + "PROJECT = app_data['PROJECT']\n" + "USER_ID = app_data['USER_ID']\n" + "TASK = app_data['TASK']\n" + "PROCESS = app_data['PROCESS']\n" + "APP_NUMBER = app_data['APP_NUMBER']\n" + "mf = macro_file.ScriptLibrary(app_data, task_id)\n" + "#Codes above are automatically generated. Do not modify them.\n\n\n\n"
                location = 'scripts/workflow_script/all_scripts'
                os.makedirs(location, exist_ok=True)
                new_file = location + '/' + reference_name
                f = open(new_file, 'w')
                f.write(imports + code)
                f.close()
            else:
                error_message = message

        else:
            error_message = "The file already exists"

    if error_message != "":
        return HttpResponse(content=error_message, status=404)
    else:
        return render(request, 'workflow/script/save_script.html')


def execute_script(instance, application, step):
    project = instance.project
    process = instance.process
    task = Task.objects.get(id=instance.id)
    step = step
    print(step)
    a = application

    data = ""
    errors = ""
    if project is not None:
        if process is not None:
            if task is not None:
                if step is not None:
                    if a is not None:
                        if step.script is not None:
                            reference_name = step.script.reference_name
                            if reference_name is not None:
                                if os.path.exists("./scripts/workflow_script/all_scripts/" + reference_name):
                                    out_file = open('log.txt', 'w')
                                    command = "python " + "./scripts/workflow_script/all_scripts/" + reference_name + " " + str(
                                        task.id) + " " + "'" + a.data + "'" + " > " + "log.txt"
                                    result = Popen(command, stdout=out_file, stderr=PIPE, universal_newlines=True,
                                                   shell=True)
                                    out_file.close()
                                    with open("log.txt", 'r') as file:
                                        data = data + file.read()
                                        file.close()
                                        os.remove("log.txt")

                                        data = data + "\n\n"
                                        errors = result.stderr + "\n\n"
                                else:
                                    errors = errors + "Script not found.\n\n"

                            else:
                                errors = errors + "Script not found.\n\n"
                        else:
                            errors = errors + "No script is assigned to this step.\n\n"
                    else:
                        errors = errors + "There is no current application.\n\n"
                else:
                    errors = errors + "step not found.\n\n"
            else:
                errors = errors + "task not found.\n\n"
        else:
            errors = errors + "process not found.\n\n"
    else:
        errors = errors + "project not found.\n\n"

    data = "Script:" + step.script.file_name + "\n" + "Application Id:" + str(a.id) + " Project Id:" + str(
        project.id) + " Process:" + str(process) + " Task Id:" + str(task.id) + " Step Id:" + str(
        step.id) + "\n" + "Output of Script:\n" + data + "\n\n\n\n"
    write_log(data)
    errors = "Script:" + step.script.file_name + "\n" + "Application Id:" + str(a.id) + " Project Id:" + str(
        project.id) + " Process:" + str(
        process) + " Task Id:" + str(task.id) + " Step Id:" + str(step.id) + "\n" + "Errors:\n" + errors + "\n\n\n\n"
    write_errors(errors)
    return data


def write_log(data):
    directory = './media/logger/log/'
    os.makedirs(os.path.dirname(directory), exist_ok=True)
    no_files = os.listdir(directory)  # dir is your directory path
    # os.makedirs(os.path.dirname(directory + "log_" + str(datetime.datetime.now()) + ".txt"), exist_ok=True)
    if len(no_files) == 0:
        print("hello1")
        file_name = directory + "log_" + str(datetime.datetime.now()) + ".txt"
        data = str(datetime.datetime.now()) + "\n" + data
        with open(file_name, "w") as f:
            f.write(data)
            f.close()

    else:

        latest_file = max([os.path.join(directory, d) for d in os.listdir(directory)], key=os.path.getctime)
        # os.chdir(BASE_DIR)
        current_date = datetime.datetime.now()
        birth_time = os.stat(latest_file).st_birthtime
        creation_date = datetime.datetime.fromtimestamp(birth_time, timezone.utc)
        if current_date.day == 1 and (
                            current_date.day != creation_date.day or current_date.month != creation_date.month or current_date.year != creation_date.year):

            print("hello2")
            file_name = directory + "log_" + str(datetime.datetime.now()) + ".txt"
            data = str(datetime.datetime.now()) + "\n" + data
            with open(file_name, "w") as f:
                f.write(data)
                f.close()
        elif current_date.day != 1 and (
                        current_date.month != creation_date.month or current_date.year != creation_date.year):

            print("hello3")
            file_name = directory + "log_" + str(datetime.datetime.now()) + ".txt"
            os.makedirs(os.path.dirname(file_name), exist_ok=True)
            data = str(datetime.datetime.now()) + "\n" + data
            with open(file_name, "w") as f:
                f.write(data)
                f.close()
        else:
            print("hello4")
            with open(latest_file, 'r') as file:
                data = str(datetime.datetime.now()) + "\n" + data + file.read()
                file.close()
            with open(latest_file, "w") as f:
                f.write(data)
                f.close()


def write_errors(errors):
    directory = './media/logger/error/'
    os.makedirs(os.path.dirname(directory), exist_ok=True)
    no_files = os.listdir(directory)  # dir is your directory path
    if len(no_files) == 0:
        print("bye1")
        file_name = directory + "error_" + str(datetime.datetime.now()) + ".txt"
        errors = str(datetime.datetime.now()) + "\n" + errors
        with open(file_name, "w") as f:
            f.write(errors)
            f.close()

    else:
        latest_file = max([os.path.join(directory, d) for d in os.listdir(directory)], key=os.path.getctime)
        # os.chdir(BASE_DIR)
        current_date = datetime.datetime.now()
        birth_time = os.stat(latest_file).st_birthtime
        creation_date = datetime.datetime.fromtimestamp(birth_time, timezone.utc)
        if current_date.day == 1 and (
                            current_date.day != creation_date.day or current_date.month != creation_date.month or current_date.year != creation_date.year):
            print("bye2")
            file_name = directory + "error_" + str(datetime.datetime.now()) + ".txt"
            errors = str(datetime.datetime.now()) + "\n" + errors
            with open(file_name, "w") as f:
                f.write(errors)
                f.close()
        elif current_date.day != 1 and (
                        current_date.month != creation_date.month or current_date.year != creation_date.year):
            print("bye3")
            file_name = directory + "error_" + str(datetime.datetime.now()) + ".txt"
            errors = str(datetime.datetime.now()) + "\n" + errors
            with open(file_name, "w") as f:
                f.write(errors)
                f.close()
        else:
            print("bye4")
            with open(latest_file, 'r') as file:
                errors = str(datetime.datetime.now()) + "\n" + errors + file.read()
                file.close()
            with open(latest_file, "w") as f:
                f.write(errors)
                f.close()
