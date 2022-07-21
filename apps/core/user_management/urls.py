from django.conf.urls import url
from .views import *

urlpatterns = [
    # user
    url(r'^list', UserManagementView.as_view(), name='list'),
    url(r'^add_user', AddUser.as_view(), name='add_user'),
    url(r'^edit_user/(?P<pk>[0-9]+)/$', EditUser.as_view(), name='edit_user'),
    # role
    url(r'^role_list', RoleList.as_view(), name='role_list'),
    # department
    url(r'^department', department.as_view(), name='departments'),
    # Group
    url(r'^group_list', GroupList.as_view(), name='group_list'),
    url(r'^appuser_list', AppUserList.as_view(), name='appuser_list'),
    url(r'^menu_list', MenuList.as_view(), name= 'menu_list'),
    url(r'^license', license.as_view(), name='license'),
    url(r'^EmailContent', EmailContent.as_view(), name='EmailContent')

]
