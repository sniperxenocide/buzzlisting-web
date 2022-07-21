from django.shortcuts import redirect
from django.utils.decorators import method_decorator

from apps.core.rbac.models import User
from functools import wraps

from django.core.exceptions import PermissionDenied


# def admin_permission(request):
#     if request.user.role_id == 1:
#         pass
#     else:
#         # if request.user
#         return redirect('dashboard:dashboard')
