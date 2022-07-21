from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()
router.register('role', RoleViewSet, base_name='role')
router.register('permission', PermissionViewSet, base_name='permission')
router.register('user', UserViewSet, base_name='user')
router.register('delegate', DelegateViewSet, base_name='delegate')
router.register('group', GroupViewSet, base_name='group')

##Buzzlisting
router.register('freehold', FreeholdViewSet, base_name='freehold')
router.register('condo', CondoViewSet, base_name='condo')
router.register('commercial', CommercialViewSet, base_name='commercial')
router.register('countFreehold', FreeholdCount, base_name='countFreehold')
router.register('countCondo', CondoCount, base_name='countCondo')
router.register('countCommercial', CommercialCount, base_name='countCommercial')
router.register('appUser', AppUserViewset, base_name='appUser')
router.register('appUserList', AppUserListViewset, base_name='appUserList')
router.register('unregister', UnregisterAppUser, base_name='unregister')
router.register('countRegistered', RegisteredUserCount, base_name='countRegistered')
router.register('countUnregistered', UnregisteredUserCount, base_name='countUnregistered')
router.register('logout', logoutAppUser, base_name='logout')
router.register('checkmail', CheckRegisteredUser, base_name='checkmail')
router.register('appview', AppviewViewset, base_name='appview')
router.register('propertyview', PropertyviewViewset, base_name='propertyview')
router.register('appviewcount', AppViewCount, base_name='appviewcount')
router.register('ardata', HouseLocationViewSet, base_name='ardata')
router.register('favdata', FavouriteEntryDelete, base_name='favdata')
router.register('resolved', ResolvedContactRequestList, base_name='resolved')
router.register('unresolved', UnresolvedContactRequestList, base_name='unresolved')
router.register('unresolvedEntry', UnresolvedEntry, base_name='unresolvedEntry')
router.register('menulist', MenuList, base_name='menulist')
router.register('terms', Terms, base_name='terms')
router.register('emailContent', EmailContent, base_name='emailContent')
router.register('favList', FavouriteList, base_name='favList')


urlpatterns = [
    url(r'^', include(router.urls)),
]
