from django.conf.urls import url, include
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("department", views.DepartmentViewSet, 'department'),
router.register("freestaff", views.getFreeStaffViewSet, 'freestaff'),
router.register("departmentstaff", views.getDepartmentUserViewSet, 'departmentstaff'),
router.register("maricodepartments", views.MaricoDepartmentViewSet, 'maricodepartments'),


urlpatterns = [
    url(r'^getdepartment/$', views.getDepartment, name='getdepartment'),
    url(r'^division/(?P<pk>[0-9]+)/$', views.division, name='division'),
    url(r'^orgchart/$', views.OrgchartView, name='orgchart'),

    url(r'^', include(router.urls))
]
