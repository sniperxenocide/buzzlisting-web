from rest_framework.permissions import BasePermission


class GreenOfficeApiBasePermission(BasePermission):
    def __init__(self, perm_id):
        self.perm_id = perm_id
        super(GreenOfficeApiBasePermission, self).__init__()

    def has_permission(self, request, view):
        if request.user.is_anonymous():
            return False
        
        if request.user.role.id == 1:
            return True
        else:
            for perm in self.perm_id:
                if request.user.role.permission.filter(pk=perm).exists():
                    return True
            return False
