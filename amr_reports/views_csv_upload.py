import csv, io, datetime, re
from django.db import transaction
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response
from .models import LabResult
ALLOWED_SEX = {"Male", "Female", "M", "F"}
ALLOWED_SUSC = {"S", "I", "R", "Susceptible", "Intermediate", "Resistant"}
MANDATORY = [
    "patient_id","sex","age","specimen_type","collection_date",
    "organism_isolated","antibiotic_tested","susceptibility",
    "method","laboratory","facility_location",
]
date_pat = re.compile(r"\d{4}-\d{2}-\d{2}")
class LabResultCSVUpload(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        if "file" not in request.FILES:
            return Response({"detail":"No file part"}, status=400)
        f = request.FILES["file"]
        if not f.name.lower().endswith(".csv"):
            return Response({"detail":"Only .csv accepted"}, status=400)
        data = io.StringIO(f.read().decode("utf‑8"))
        reader = csv.DictReader(data)
        missing = [c for c in MANDATORY if c not in reader.fieldnames]
        if missing:
            return Response({"detail":f"Missing columns: {missing}"}, status=400)
        created, errors = 0, []
        with transaction.atomic():
            for idx,row in enumerate(reader, start=2):      # header = line 1
                row = {k:v.strip() for k,v in row.items()}
                # --- basic WHO validation ---
                if row["sex"] not in ALLOWED_SEX:
                    errors.append(f"L{idx}: invalid sex")
                if row["susceptibility"] not in ALLOWED_SUSC:
                    errors.append(f"L{idx}: invalid susceptibility")
                if not row["age"].isdigit():
                    errors.append(f"L{idx}: age must be numeric")
                if not date_pat.fullmatch(row["collection_date"]):
                    errors.append(f"L{idx}: collection_date must be YYYY‑MM‑DD")
                # stop early if too many errors
                if len(errors) > 20:
                    break
                # convert / normalize
                row["sex"] = "Male" if row["sex"] in {"M","Male"} else "Female"
                row["susceptibility"] = {
                    "S":"Susceptible","I":"Intermediate","R":"Resistant"
                }.get(row["susceptibility"], row["susceptibility"])
                # create model
                LabResult.objects.create(
                    patient_id         = row["patient_id"],
                    sex                = row["sex"],
                    age                = int(row["age"]),
                    specimen_type      = row["specimen_type"],
                    collection_date    = parse_date(row["collection_date"]) or datetime.date.today(),
                    organism_isolated  = row["organism_isolated"],
                    antibiotic_tested  = row["antibiotic_tested"],
                    susceptibility     = row["susceptibility"],
                    method             = row["method"],
                    laboratory         = row["laboratory"],
                    facility_location  = row["facility_location"],
                )
                created += 1
        if errors:
            return Response({"created":created,"errors":errors}, status=400)
        return Response({"created":created}, status=status.HTTP_201_CREATED)
