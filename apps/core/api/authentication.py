from django.utils import timezone
from rest_framework import authentication
from rest_framework import exceptions
from rest_framework.authentication import get_authorization_header

from apps.core.rbac.ModelBackend import EmailOrUsernameModelBackend


class GreenOfficeBasicAuthentication(authentication.BaseAuthentication):
    www_authenticate_realm = 'api'

    def authenticate(self, request):
        try:
            username = request.data.get('username')
        except AttributeError:
            username = None

        try:
            password = request.data.get('password')
        except AttributeError:
            password = None

        back_end = EmailOrUsernameModelBackend()

        if not username or not password:
            user = getattr(request._request, 'user', None)
            if user and not user.is_anonymous():
                return user, None

            auth = get_authorization_header(request).split()

            if not auth or auth[0].lower() != b'basic':
                return None

        user = back_end.authenticate(username, password)

        if not user.is_active or int(user.status) != 1:
            raise exceptions.AuthenticationFailed('Your account is inactive. Please contact with administrator. '
                                                  'Thank you')

        if timezone.now() > user.expiry_date:
            raise exceptions.AuthenticationFailed('Your account has been expired. Please contact with administrator. '
                                                  'Thank you')

        return user, None

    def authenticate_header(self, request):
        pass
