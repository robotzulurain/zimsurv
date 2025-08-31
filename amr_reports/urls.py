from django.urls import path
from .summary_views import counts_summary, resistance_time_trend, data_quality_summary
from .geo_views import facilities_geo
from .compare_views import compare_resistance
from .antibiogram_views import antibiogram_matrix as antibiogram
from .lab_results_views import lab_results_list
from .facility_views import set_coords
from .manual_entry_views import ManualLabResultView

urlpatterns = [
    # summaries
    path('summary/counts-summary/', counts_summary),
    path('summary/resistance-time-trend/', resistance_time_trend),
    path('summary/data-quality/', data_quality_summary),
    path('summary/facilities-geo/', facilities_geo),

    # antibiogram / compare
    path('summary/antibiogram/', antibiogram),
    path('compare/', compare_resistance),

    # lab results + manual entry + facility tools
    path('lab-results/', lab_results_list),
    path('manual-entry/', ManualLabResultView.as_view(), name='manual-entry'),
    path('facility/set-coords/', set_coords),
]
