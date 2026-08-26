from django.urls import path
from .views import CustomersExportView, OverviewView
urlpatterns = [
    path("overview/", OverviewView.as_view(), name="dashboard-overview"),
    path("export/customers/", CustomersExportView.as_view(), name="dashboard-customers-export"),
]
