from django.contrib.auth import get_user_model, logout
from django.core.exceptions import ValidationError

from apps.core.rbac.models import User

from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.shortcuts import redirect
from re import compile


class EmailOrUsernameModelBackend(object):
    """
    This is a ModelBacked that allows authentication with either a username or an email address.

    """

    def authenticate(self, username=None, password=None):
        if '@' in username:
            kwargs = {'email': username}
        else:
            kwargs = {'username': username}
        try:
            user = get_user_model().objects.get(**kwargs)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, username):
        try:
            return get_user_model().objects.get(pk=username)
        except get_user_model().DoesNotExist:
            return None


EXEMPT_URLS = [compile(settings.LOGIN_URL.lstrip('/'))]

if hasattr(settings, 'LOGIN_EXEMPT_URLS'):
    EXEMPT_URLS += [compile(expr) for expr in settings.LOGIN_EXEMPT_URLS]


class AccountsMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_anonymous():
            path = request.path_info.lstrip('/')
            if not any(m.match(path) for m in EXEMPT_URLS):
                return redirect(settings.LOGIN_URL)
        else:
            if not request.user.is_active or int(request.user.status) != 1:
                logout(request)
                path = request.path_info.lstrip('/')
                if not any(m.match(path) for m in EXEMPT_URLS):
                    return redirect(settings.LOGIN_URL)
