from rest_framework.exceptions import ValidationError
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator

from apps.core.rbac.models import Role

SPACELESS_LOWER_CONDITION = "LOWER(REPLACE(%s, ' ','')) = LOWER(REPLACE('%s', ' ', ''))"


class AdminRoleValidator(UniqueTogetherValidator):

    def __call__(self, attrs):
        qs = Role.objects.filter(hotel=None, name=attrs['name'])
        qs = self.exclude_current_instance(attrs, qs)
        if qs.exists():
            message = self.message.format()
            raise ValidationError({'name': message})


class UniqueTogether1stFieldMessageValidator(UniqueTogetherValidator):

    def __call__(self, attrs):
        self.enforce_required_fields(attrs)
        queryset = self.queryset
        queryset = self.filter_queryset(attrs, queryset)
        queryset = self.exclude_current_instance(attrs, queryset)

        # Ignore validation if any field is None
        checked_values = [
            value for field, value in attrs.items() if field in self.fields
        ]
        if None not in checked_values and queryset.exists():
            field_names = ', '.join(self.fields)
            raise ValidationError({self.fields[0]: self.message.format(field_names=field_names)})


class CIUniqueValidator(UniqueValidator):

    def __init__(self, queryset, field='', message=None):
        super(CIUniqueValidator, self).__init__(queryset, message)
        self.field_name = field

    def set_context(self, serializer_field):
        self.instance = getattr(serializer_field, 'instance', None)

    def filter_queryset(self, value, queryset):
        return queryset.extra(where=[SPACELESS_LOWER_CONDITION % (self.field_name, value[self.field_name])])

    def __call__(self, value):
        queryset = self.queryset
        queryset = self.filter_queryset(value, queryset)
        queryset = self.exclude_current_instance(queryset)
        if queryset.exists():
            raise ValidationError({self.field_name: self.message})


class CIUniqueTogether1stFieldMessageValidator(UniqueTogether1stFieldMessageValidator):

    def filter_queryset(self, attrs, queryset):

        if self.instance is not None:
            for field_name in self.fields[1:]:
                if field_name not in attrs:
                    attrs[field_name] = getattr(self.instance, field_name)

        # Determine the filter keyword arguments and filter the queryset.
        filter_kwargs = {
            field_name: attrs[field_name]
            for field_name in self.fields[1:]
        }
        field_name = self.fields[0]
        return queryset.filter(**filter_kwargs).extra(where=[SPACELESS_LOWER_CONDITION % (field_name, attrs[field_name])])
