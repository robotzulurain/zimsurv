#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f venv/bin/activate ] && source venv/bin/activate || true

echo "→ Checking server…"
curl -fsS http://127.0.0.1:8000/api/options >/dev/null
echo "  OK /api/options"

TMPCSV="$(mktemp)"
cat > "$TMPCSV" <<CSV
patient_id,sex,age,specimen_type,organism,antibiotic,ast_result,test_date,host_type,facility,patient_type,animal_species,environment_type
SMOKE-1,F,30,URINE,Escherichia coli,Ciprofloxacin,R,2025-09-24,HUMAN,Harare Central Lab,OUTPATIENT,,
CSV

echo "→ Uploading a one-row CSV…"
curl -fsS -F "file=@$TMPCSV;type=text/csv" http://127.0.0.1:8000/api/upload/csv | jq .
rm -f "$TMPCSV"
echo "✅ Smoke test complete"
