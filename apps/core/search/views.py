from django.views.generic import TemplateView


class SearchResultView(TemplateView):

    template_name = 'core/search/search_result.html'

