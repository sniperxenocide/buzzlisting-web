import html

from django.views.generic import TemplateView
from django.conf import settings
from apps.core.admin.views import admin_sidebar_menu
from django.template.loader import render_to_string
from django.core.mail import send_mail
from conf import licensed
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.dms.api.dms_activity.models import DmsActivity
from django.utils import timezone
from django.core.mail import send_mail, EmailMessage

# @method_decorator(login_required, name='get')


class MailView(TemplateView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'core/mail/mail.html'


# class MailSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Mail
#         fields = '__all__'
#
#
# class MailViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.DjangoModelPermissions]
#     serializer_class = MailSerializer
#     pagination_class = LargeResultsSetPagination
#     model = Mail
#     queryset = Mail.objects.all()


@api_view(['POST'])
def get_mail(request):
    to = request.data['to']
    subject = request.data['subject']
    message = request.data['message']
    html_content = render_to_string('email/test_mail_template.html',
                                    {
                                        'sent_by': licensed.EMAIL_HOST_USER,
                                        'message': message
                                    }
                                    )
    send_mail(subject=subject, message='',
              from_email=licensed.EMAIL_HOST_USER,
              recipient_list=[to],
              html_message=html_content,
              fail_silently=False)
    # email = EmailMessage()
    # email.subject = "New shirt submitted"
    # email.body = "attachment"
    # email.from_email = licensed.EMAIL_HOST_USER
    # email.to = ["rasel@infosapex.com", ]
    #
    # email.attach_file(settings.BASE_DIR + '/media/repository/2018-01-01/30deff3a3981c15e55a09a78d977a54b.pdf')  # Attach a file directly
    #
    # # Or alternatively, if you want to attach the contents directly
    #
    # # file = open("hellokitty.jpg", "rb")
    # # email.attach(filename="hellokitty.jpg", mimetype="image/jpeg", content=file.read())
    # # file.close()
    #
    # email.send()
    description = "A test mail has been sent to " + to

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[-1].strip()
    else:
        ip_address = request.META.get('REMOTE_ADDR')

    DmsActivity(user=request.user, operation="Test Mail",
                ip=ip_address,
                description=description, activity_time=timezone.now()).save()
    # send_mail(subject,
    #           message,
    #           licensed.EMAIL_HOST_USER,
    #           [to],
    #           fail_silently=False)
    return Response({'success': "Mail Sent"}, status=200)
