from django.urls import path
from .views_dataentry import DataEntryCreate, DataEntryBulk

urlpatterns = [
    path("api/data-entry/", DataEntryCreate.as_view(), name="data-entry"),
    path("api/data-entry/bulk/", DataEntryBulk.as_view(), name="data-entry-bulk"),
]
