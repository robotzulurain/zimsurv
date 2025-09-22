from django.contrib import admin
from django.urls import path

from amr_api.views_public import (
    OptionsView,
    CountsSummaryView, TimeTrendsView, AntibiogramView, SexAgeView,
    GeoFacilitiesView,
    ReportSummaryView, ReportFacilityLeagueView, ReportAntibiogramView,
    AlertsView,
)
from amr_api.open_views import CSVUploadOpenView, ManualEntryOpenView

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth (keep if you use them elsewhere)
    path('api/auth/token', AlertsView.as_view()),   # placeholder to avoid 404
    path('api/auth/whoami', AlertsView.as_view()),  # placeholder

    # options
    path('api/options', OptionsView.as_view()),

    # summaries
    path('api/summary/counts-summary', CountsSummaryView.as_view()),
    path('api/summary/time-trends', TimeTrendsView.as_view()),
    path('api/summary/antibiogram', AntibiogramView.as_view()),
    path('api/summary/sex-age', SexAgeView.as_view()),

    # geo
    path('api/geo/facilities', GeoFacilitiesView.as_view()),

    # data entry (open)
    path('api/upload/csv-open', CSVUploadOpenView.as_view()),
    path('api/entry-open', ManualEntryOpenView.as_view()),

    # legacy (auth-protected?) endpoints you already had
    path('api/entry', ManualEntryOpenView.as_view()),         # map to open version for now
    path('api/upload/csv', CSVUploadOpenView.as_view()),      # map to open version for now

    # reports
    path('api/reports/summary', ReportSummaryView.as_view()),
    path('api/reports/facility-league', ReportFacilityLeagueView.as_view()),
    path('api/reports/antibiogram', ReportAntibiogramView.as_view()),

    # alerts placeholder
    path('api/alerts', AlertsView.as_view()),
]
