from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from django import forms
from django.contrib.auth import login
from django.contrib.auth.forms import AuthenticationForm, UsernameField
#from django.apps.core.

from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.core.admin.views import get_ip_address
from conf.settings import LOGIN_URL

from apps.core.loginReport.models import LoginReport
from rest_framework import serializers, viewsets, mixins, status
from rest_framework.generics import UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from apps.core.rbac.models import User

# render application authentication page
class LoginView(TemplateView):
    template_name = 'core/auth/login.html'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            print("login_view get")
            next_url = request.GET.get('next')
            if next_url:
                return HttpResponseRedirect(next_url)

            return redirect('dashboard:dashboard')
        return render(request, template_name=self.template_name)


# logout a user
class LogoutView(LoginView):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated():
            user = request.user.id
            login_req = LoginReport.objects.filter(user=user).order_by('-login').first()
            login_req.logout = timezone.now()
            login_req.save()
            logout(request)

        return redirect(LOGIN_URL)


class LoginForm(AuthenticationForm):
    username = UsernameField(
        max_length=254,
        widget=forms.TextInput(attrs={'autofocus': ''}),
        error_messages={'required': 'Username/Email can not be empty.'}
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput,
        error_messages={'required': 'Password can not be empty.'}
    )

    error_messages = {
        'invalid_login': _(
            "Please enter a correct %(username)s and password. Note that both "
            "fields may be case-sensitive."
        ),
        'inactive': _("This account is inactive. Please contact with administrator."),
        'expired': _("Your account has been expired. Please contact with administrator. 'Thank you"),
    }

    def confirm_login_allowed(self, user):
        #print("confirm_login_allowed")
        #print(user.status)
        #if user.configuration_type == 0:
        #    print("here", 1)
        #    settings.USER_DMS == '1q2w3e'
        #    settings.USER_WORKFLOW == '1q2w3e'
        #elif user.configuration_type == 1:
        #    print("here", 2)
        #    settings.USER_DMS == '1q2w3e'
        #    settings.USER_WORKFLOW == ''
        #else:
        #    print("here", 3)
        #    settings.USER_DMS == ''
        #    settings.USER_WORKFLOW == '1q2w3e'
        if int(user.status) != 1:
            raise forms.ValidationError(
                self.error_messages['inactive'],
                code='inactive',
            )

        if not user.is_active:
            raise forms.ValidationError(
                self.error_messages['inactive'],
                code='inactive',
            )

        if timezone.now() > user.expiry_date:
            raise forms.ValidationError(
                self.error_messages['expired'],
                code='expired',
            )


@api_view(['POST'])
def login_user(request):
    print("login_user")
    form = LoginForm(request, data=request.POST)

    if form.is_valid():
        login(request, user=form.get_user())
        LoginReport(user_id=request.user.id, login=timezone.now(), ip=get_ip_address(request)).save()
        request.session['permission_list'] = list(request.user.role.permission.values_list('id', flat=True))
        return Response(status=200)
    else:
        message = ''
        for error in form.errors:
            message += "%s" % (form.errors[error])
        return Response({'detail': message}, status=400)


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class ChangePasswordView(UpdateAPIView):
    """
    An endpoint for changing password.
    """
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        obj = self.request.user
        return obj

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong old password."]}, status=status.HTTP_400_BAD_REQUEST)
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response("Success.", status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)