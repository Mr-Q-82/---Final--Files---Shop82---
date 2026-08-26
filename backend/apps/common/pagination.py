from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    # Public catalog clients can intentionally request a compact batch.  The
    # product list serializer keeps these responses small; larger batches avoid
    # 18-25 sequential HTTP round trips on the shop route.
    max_page_size = 500
