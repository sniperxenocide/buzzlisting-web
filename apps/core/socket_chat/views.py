# Create your views here.
import json

from apps.core.rbac.models import User
from apps.workflow.bpmn.models import Delegation
from .models import Comments, Statuses
from django.shortcuts import render, render_to_response
from django.http import HttpResponse, HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sessions.models import Session
from django.contrib.auth.decorators import login_required

import redis


@csrf_exempt
def redis_pub(msg, recipients_arr):
    try:
        if msg is not None and msg != "":
            c = Comments(text=msg)
            c.save()
            if recipients_arr is not None:
                for i in recipients_arr:
                    print(i)
                    r = User.objects.get(id=i)
                    s = Statuses(users=r)
                    s.save()
                    c.recipients.add(s)

                data = json.dumps(
                    {
                        'message': msg,
                        'recipients': recipients_arr
                    }
                )

                # Once comment has been created post it to the chat channel
                r = redis.StrictRedis(host='localhost', port=6379, db=0)
                r.publish('announcement', data)

        return "Everything worked :)"
    except Exception as e:
        return str(e)


def redis_pub_task(msg, recipients_arr):
    try:
        if msg is not None and msg != "":
            if recipients_arr is not None:
                data = json.dumps(
                    {
                        'message': msg,
                        'recipients': recipients_arr
                    }
                )

                # Once comment has been created post it to the task channel
                r = redis.StrictRedis(host='localhost', port=6379, db=0)
                r.publish('task', data)

        return "Everything worked :)"
    except Exception as e:
        return str(e)


def redis_completed_task(msg):
    try:
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('completed_task', msg)
        return "completed task done"
    except Exception as e:
        return str(e)


def redis_pub_pending(count):
    try:
        data = count
        # Once document has been attached post it to the pending channel
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('pending', data)
        return "Count done"
    except Exception as e:
        return str(e)


def redis_doc_summary(msg):
    try:
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('doc_summary', msg)
        print(msg)
        return "Attach meta doc upload done"
    except Exception as e:
        return str(e)


def redis_checkout_doc(msg):
    try:
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('checkout_docs', msg)
        # print(msg)
        return "Checkout done"
    except Exception as e:
        return str(e)


def redis_pub_application_count():
    # print("soket-print")
    try:
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.publish('app_count', 'Hello')
        return "Application Count"
    except Exception as e:
        return str(e)

