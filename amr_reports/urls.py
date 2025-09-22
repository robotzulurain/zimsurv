from django.urls import path
from . import api_real as api

urlpatterns = [
    # SUMMARY
    path('summary/counts-summary', api.CountsSummaryView.as_view()),
    path('summary/time-trends',    api.TimeTrendsView.as_view()),
    path('summary/antibiogram',    api.AntibiogramView.as_view()),
    path('summary/sex-age',        api.SexAgeView.as_view()),

    # GEO
    path('geo/facilities', api.FacilitiesView.as_view()),

    # OPTIONS / ENTRY / UPLOAD / TEMPLATE
    path('options',       api.OptionsView.as_view()),
    path('entry',         api.ManualEntryView.as_view()),
    path('upload',        api.UploadView.as_view()),
    path('templates/csv', api.TemplateCSVView.as_view()),

    # ALERTS / EXPORT
    path('alerts',        api.AlertsView.as_view()),
    path('export/glass',  api.GlassExportView.as_view()),

    # AUTH
    path('auth/token',  api.TokenView.as_view()),
    path('auth/whoami', api.WhoAmIView.as_view()),
]
