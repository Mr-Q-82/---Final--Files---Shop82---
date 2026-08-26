from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AdminOrderViewSet, DiscountCodeViewSet, OrderViewSet, ReturnRequestViewSet
router = DefaultRouter()
router.register("discounts", DiscountCodeViewSet, basename="discounts")
router.register("admin/all", AdminOrderViewSet, basename="admin-orders")
router.register("returns", ReturnRequestViewSet, basename="returns")
router.register("", OrderViewSet, basename="orders")
urlpatterns = [path("", include(router.urls))]
