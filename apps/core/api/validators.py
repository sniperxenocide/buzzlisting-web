from rest_framework.validators import UniqueValidator, qs_filter


class UniqueNameValidator(UniqueValidator):
    def filter_queryset(self, value, queryset):
        """
        Filter the queryset to all instances matching the given attribute.
        """
        filter_kwargs = {
            '%s__%s' % (self.field_name, self.lookup): " ".join(value.split())
        }
        return qs_filter(queryset, **filter_kwargs)
