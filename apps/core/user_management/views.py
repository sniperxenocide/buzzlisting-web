from django.views.generic import DetailView

from apps.core.admin.views import *
from apps.core.rbac.models import User, AppUser
from apps.core.rbac.views import AppUserSerializer

from apps.core.admin.views import get_ip_address
from apps.core.api.Pagination import LargeResultsSetPagination


class UserManagementView(AdminView):
    template_name = 'core/user_management/users.html'


class AddUser(AdminView):
    template_name = 'core/user_management/add_user.html'


class EditUser(DetailView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'core/user_management/edit_user.html'
    model = User


class RoleList(AdminView):
    template_name = 'core/user_management/role_list.html'


class department(AdminView):
    sidebar_menu = admin_sidebar_menu
    template_name = 'core/user_management/department.html'


class GroupList(AdminView):
    template_name = 'core/user_management/group_list.html'


class AppUserList(AdminView):
    template_name = 'core/user_management/appuser_list.html'

class MenuList(AdminView):
    template_name = 'core/user_management/menu_list.html'

class license(AdminView):
    template_name = 'core/user_management/license.html'

class EmailContent(AdminView):
    template_name = 'core/user_management/EmailContent.html'

