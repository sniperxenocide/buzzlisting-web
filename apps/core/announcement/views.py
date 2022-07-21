import html
import operator
from functools import reduce
from django.db.models import Q
from html.parser import HTMLParser

from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.core.admin.views import *
from apps.core.announcement.models import Announcement
from apps.core.api.permission import GreenOfficeApiBasePermission
from apps.core.api.viewset import CustomViewSetForQuerySet
from apps.core.rbac.models import User
from rest_framework import permissions
from rest_framework import serializers, viewsets
from apps.core.api.Pagination import LargeResultsSetPagination
from apps.core.socket_chat.views import redis_pub, redis_pub_task
from conf import licensed
from apps.dms.api.dms_activity.models import DmsActivity
from django.utils import timezone


class AnnouncementView(AdminView):
    template_name = 'core/announcement/announcement.html'


class AnnouncementSerializer(serializers.ModelSerializer):
    audience = serializers.StringRelatedField(source='user', many=True, read_only=True)
    groups_name = serializers.StringRelatedField(source='group', many=True, read_only=True)

    def create(self, validated_data):
        escape_data = html.escape(validated_data.get('message'))
        #Upama
        recipients = []
        #Upama

        if validated_data.get('type') == "3":
            user_list = User.objects.all().values_list('id', flat=True)
            announce = Announcement(
                message=escape_data,
                type=validated_data.get('type'),
            )
            announce.save()
            for u in user_list:
                announce.user.add(u)

            users = User.objects.all()
            for user in users:
                subject = "Announcement"
                to = [user.email]
                from_email = licensed.EMAIL_HOST_USER

                html_parser = html.parser.HTMLParser()
                unescaped = html_parser.unescape(announce.message)
                ctx = {
                    'text': unescaped,
                    'name': user.get_full_name()
                }

                message = render_to_string('email/announcement_email.html', ctx)

                send_mail(subject=subject, message='',
                          from_email=from_email,
                          recipient_list=to, html_message=message, fail_silently=False)
                #Upama
                recipients.append(user.id)
            redis_pub(validated_data.get('message'), recipients)
                #Upama
            # Audit Trail
            operation = "Sent Announcement"
            description = "An Announcement has been sent to All Users"
            x_forwarded_for = self.context['request'].META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[-1].strip()
            else:
                ip_address = self.context['request'].META.get('REMOTE_ADDR')
            DmsActivity(user=self.context['request'].user, operation=operation,
                        ip=ip_address,
                        description=description, activity_time=timezone.now()).save()
            return announce
        elif validated_data.get('type') == "2":
            group_list = validated_data.get('group')
            announce = Announcement(
                message=escape_data,
                type=validated_data.get('type'),
            )
            announce.save()
            for g in group_list:
                announce.group.add(g)
                single_group_user = g.user.all().values_list('id', flat=True)
                # print(single_group_user)
                for sgu in single_group_user:
                    announce.user.add(sgu)
                users = g.user.all()
                for user in users:
                    subject = "Announcement"
                    to = [user.email]
                    from_email = licensed.EMAIL_HOST_USER

                    html_parser = html.parser.HTMLParser()
                    unescaped = html_parser.unescape(announce.message)
                    ctx = {
                        'text': unescaped,
                        'name': user.get_full_name()
                    }

                    message = render_to_string('email/announcement_email.html', ctx)

                    send_mail(subject=subject, message='',
                              from_email=from_email,
                              recipient_list=to, html_message=message, fail_silently=False)
                    #Upama
                    recipients.append(user.id)
                    #Upama
            redis_pub(validated_data.get('message'), recipients)
            # Audit Trail
            group_name = []
            for g in group_list:
                group_name.append(g.name)
            grp_name = ", ".join(group_name)
            operation = "Sent Group Announcement"
            description = "An Announcement has been sent to Group: " + grp_name
            x_forwarded_for = self.context['request'].META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[-1].strip()
            else:
                ip_address = self.context['request'].META.get('REMOTE_ADDR')
            DmsActivity(user=self.context['request'].user, operation=operation,
                        ip=ip_address,
                        description=description, activity_time=timezone.now()).save()
            return announce

        else:
            announce = Announcement(
                message=escape_data,
                type=validated_data.get('type'),
            )
            announce.save()
            users = validated_data.get('user')
            user_name = []
            for u in users:
                user_name.append(u.get_full_name())
                announce.user.add(u)
                subject = "Announcement"
                to = [u.email]
                from_email = licensed.EMAIL_HOST_USER

                html_parser = html.parser.HTMLParser()
                unescaped = html_parser.unescape(announce.message)
                ctx = {
                    'text': unescaped,
                    'name': u.get_full_name()
                }

                message = render_to_string('email/announcement_email.html', ctx)

                send_mail(subject=subject, message='',
                          from_email=from_email,
                          recipient_list=to, html_message=message, fail_silently=False)
                # Upama
                recipients.append(u.id)
                print(validated_data.get('message'))
            # Audit Trail
            usr_name = ", ".join(user_name)
            operation = "Sent User Announcement"
            description = "An Announcement has been sent to User: " + usr_name
            x_forwarded_for = self.context['request'].META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[-1].strip()
            else:
                ip_address = self.context['request'].META.get('REMOTE_ADDR')
            DmsActivity(user=self.context['request'].user, operation=operation,
                        ip=ip_address,
                        description=description, activity_time=timezone.now()).save()
            redis_pub(validated_data.get('message'), recipients)
            #temp
            print("start task socket_io")
            #redis_pub_task(validated_data.get('message'), recipients)
            print("start task socket.io")
            # Upama
            return announce

    class Meta:
        model = Announcement
        fields = '__all__'


class AnnouncementViewSet(CustomViewSetForQuerySet):
    permission_classes = [GreenOfficeApiBasePermission]
    serializer_class = AnnouncementSerializer
    pagination_class = LargeResultsSetPagination
    queryset = Announcement.objects.all()
    model = Announcement
    permission_id = [22, ]
    change_keys = {
        # 'date': 'announcement__date',
        # 'username': 'username',
    }
    search_keywords = ['type', 'message', 'date']

    def get_queryset(self):
        if self.model is None:
            raise AssertionError(
                'CustomViewSetForQuerySet need to include a model')
        if self.request.user.role.id == 1:
            queryset = self.model.objects.filter()
        else:
            queryset = self.model.objects.filter(user=self.request.user)
        search = self.request.query_params.get('search[value]', None)
        column_id = self.request.query_params.get('order[0][column]', None)

        # search
        if search and search is not None and self.search_keywords is not None:
            search_logic = []

            for entity in self.search_keywords:
                search_logic.append(Q(**{entity + '__icontains': search}))

            queryset = queryset.filter(reduce(operator.or_, search_logic))

        # ascending or descending order
        if column_id and column_id is not None:
            column_name = self.request.query_params.get(
                'columns[' + column_id + '][data]', None)

            if self.change_keys is not None:
                for key in self.change_keys:
                    if column_name == key:
                        column_name = self.change_keys.get(key)

            if column_name != '':
                order_dir = '-' if self.request.query_params.get(
                    'order[0][dir]') == 'desc' else ''
                queryset = queryset.order_by(order_dir + column_name)

        return queryset


