from amr_api.models import LabResult
from datetime import date
rows = [
    dict(patient_id="P001", sex="M", age=34, specimen_type="Blood",
         organism="Escherichia coli", antibiotic="Ciprofloxacin", ast_result="R",
         test_date=date(2025,8,1), host_type="HUMAN", facility="Harare Central Lab"),
    dict(patient_id="P002", sex="F", age=22, specimen_type="Urine",
         organism="Klebsiella pneumoniae", antibiotic="Ceftriaxone", ast_result="S",
         test_date=date(2025,8,2), host_type="HUMAN", facility="Bulawayo NatLab"),
    dict(patient_id="P003", sex="M", age=5, specimen_type="Stool",
         organism="Salmonella spp.", antibiotic="Amoxicillin-clavulanate", ast_result="R",
         test_date=date(2025,8,3), host_type="HUMAN", facility="Gweru General Hospital"),
    dict(patient_id="P004", sex="F", age=47, specimen_type="Sputum",
         organism="Staphylococcus aureus", antibiotic="Gentamicin", ast_result="I",
         test_date=date(2025,8,4), host_type="HUMAN", facility="Harare Central Lab"),
    dict(patient_id="P005", sex="M", age=60, specimen_type="Wound",
         organism="Pseudomonas aeruginosa", antibiotic="Meropenem", ast_result="S",
         test_date=date(2025,8,5), host_type="HUMAN", facility="Bulawayo NatLab"),
]
for r in rows:
    LabResult.objects.get_or_create(**r)
print("Seeded", len(rows), "rows.")
