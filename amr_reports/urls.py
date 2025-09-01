from django.urls import path
from . import views_summary
from .views_dataentry import DataEntryCreate, DataEntryBulk

urlpatterns = [
    # summaries
    path('api/summary/counts-summary/', views_summary.counts_summary, name='counts-summary'),
    path('api/summary/resistance-time-trend/', views_summary.resistance_time_trend, name='resistance-time-trend'),
    path('api/summary/antibiogram/', views_summary.antibiogram, name='antibiogram'),
    path('api/summary/sex-age/', views_summary.sex_age_matrix, name='sex-age'),
    path('api/summary/data-quality/', views_summary.data_quality, name='data-quality'),

    # lab results table endpoint (already implemented)
    path('api/lab-results/', views_summary.lab_results, name='lab-results'),

    # data entry
    path('api/data-entry/', DataEntryCreate.as_view(), name='data-entry'),
    path('api/data-entry/bulk/', DataEntryBulk.as_view(), name='data-entry-bulk'),
]
