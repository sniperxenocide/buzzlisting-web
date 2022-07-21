from django.conf.urls import url, include
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("category", views.CategoryViewSet, 'category'),
router.register("root", views.RootViewSet, 'root'),
router.register("metafield", views.MetaFieldViewSet, 'metafield'),
router.register("siblings", views.SiblingsViewSet, 'siblings'),
router.register("descendants", views.DescendantsViewSet, 'descendants'),
router.register("documenttype", views.DocumentTypeViewSet, 'documenttype'),
router.register("jstreeroot", views.JStreeRootViewSet, 'jstreeroot'),
router.register("jstreecategory", views.JsTreeCategoryViewSet, 'jstreecategory'),
router.register("unique_metafield", views.VariableExist, 'unique_metafield'),





urlpatterns = [
    # url(r'^category/$', CategoryViewSet.as_view({'get': 'list'})),
    # url(r'^post_categorization', post_categorization, name='post_categorization')
    url(r'^attachdocpermission/$', views.AttachDocumentPermission),
    url(r'^variable_unique/$', views.AttachDocumentPermission),
    url(r'^', include(router.urls))


]
