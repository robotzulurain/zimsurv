from django.urls import path
from . import views
from . import reports_views as rviews
from . import alerts_views as aviews

urlpatterns = [
    path('options', views.options_fixed),
    path('options', views.options_clean),
    # options/templates
    path("options", views.options_view),
    path("templates/csv", views.csv_template),

    # summaries
    path("summary/counts-summary", views.counts_summary),
    path("summary/time-trends", views.time_trends),
    path("summary/antibiogram", views.antibiogram),
    path("summary/sex-age", views.sex_age),

    # geo
    path("geo/facilities", views.facilities),

    # data entry
    path("entry", views.create_entry),
    path("upload", views.upload_csv),

    # reports
    path("reports/summary", rviews.report_summary),
    path("reports/facility-league", rviews.report_facility_league),
    path("reports/antibiogram", rviews.report_antibiogram),

    # alerts
    path("alerts", aviews.alerts_feed),
]
