# Common filters used by summary endpoints.
# This version adds robust support for `sex` without touching anything else.

def apply_common_filters(qs, request):
    p = request.query_params

    def val(k):
        v = p.get(k)
        return v if (v and v != "All") else None

    if val("host_type"):
        qs = qs.filter(host_type=val("host_type"))
    if val("organism"):
        qs = qs.filter(organism=val("organism"))
    if val("antibiotic"):
        qs = qs.filter(antibiotic=val("antibiotic"))
    if val("facility"):
        qs = qs.filter(facility=val("facility"))
    if val("patient_type"):
        qs = qs.filter(patient_type=val("patient_type"))

    # ✅ NEW: Sex filter (handles M/F/Unknown and Male/Female synonyms)
    if val("sex"):
        s = val("sex")
        canon = "M" if s in ("M","Male","male") else "F" if s in ("F","Female","female") else "Unknown"
        qs = qs.filter(sex__in=[s, canon])

    return qs
