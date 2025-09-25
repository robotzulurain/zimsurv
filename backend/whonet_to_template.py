#!/usr/bin/env python3
"""
Convert a WHONET-style wide CSV/XLSX into the app's narrow template CSV.

Usage:
  python3 whonet_to_template.py /path/to/whonet_file.xlsx

Outputs:
  - same-folder/whonet_converted.csv
  - same-folder/whonet_converted.xlsx  (if openpyxl available)
"""
import sys
import csv
from pathlib import Path
from datetime import datetime

# try to import openpyxl for XLSX support (reading) and writing XLSX
try:
    from openpyxl import load_workbook, Workbook
    HAVE_OPENPYXL = True
except Exception:
    HAVE_OPENPYXL = False

# mapping of common WHONET short antibiotic columns to canonical names:
ANTIBIOTIC_CODE_MAP = {
    "CIP": "Ciprofloxacin",
    "CTX": "Ceftriaxone",
    "GEN": "Gentamicin",
    "AMX": "Amoxicillin",
    "AMOX": "Amoxicillin",
    "VAN": "Vancomycin",
    # add more as you need
}

# canonical output header expected by backend
OUT_COLS = [
    "patient_id","sex","age","specimen_type","organism","antibiotic",
    "ast_result","test_date","host_type","facility","patient_type",
    "animal_species","environment_type"
]

# relax-parse common result strings into S/I/R
def canon_result(v):
    if v is None:
        return ""
    s = str(v).strip()
    if not s:
        return ""
    up = s.upper()
    if up.startswith("R"): return "R"
    if up.startswith("S"): return "S"
    if up.startswith("I"): return "I"
    # numeric or others - return as-is (or empty)
    return up

def normalize_header(h):
    return (h or "").strip().lower()

def read_xlsx(path: Path):
    wb = load_workbook(filename=str(path), read_only=True, data_only=True)
    ws = wb.active
    rows = []
    for r in ws.iter_rows(values_only=True):
        rows.append([("" if c is None else str(c)) for c in r])
    return rows

def read_csv(path: Path):
    with path.open(newline='', encoding='utf-8') as fh:
        dr = csv.reader(fh)
        return [row for row in dr]

def detect_whonet(headers):
    # headers: list of strings
    hset = {_.strip().upper() for _ in headers if _}
    signs = {"LAB NO","PATIENT ID","WHONET","ISOLATE","SPECIMEN DATE"}
    if hset & signs:
        return True
    # if many columns that look like short drug codes (2-4 letters) treat as whonet
    short_nonstd = [h for h in headers if h and len(h.strip())<=4 and h.strip().isalpha()]
    return len(short_nonstd) >= 3

def map_header_names(headers):
    """Return mapping incoming_index -> canonical_name (or None if antibiotic/unknown).
       We'll identify standard fields (patient_id, specimen_type, test_date, host_type, facility, patient_type, sex, animal_species, environment_type, organism)
       Any other column that looks like drug code will be treated as antibiotic column.
    """
    mapping = {}
    antibiotics = {}
    for i,h in enumerate(headers):
        hu = (h or "").strip().lower()
        if hu in ("patient id","patient_id","patientid","id","lab no"):
            mapping[i] = "patient_id"
        elif hu in ("sex","gender"):
            mapping[i] = "sex"
        elif hu in ("age","age_y","age_years"):
            mapping[i] = "age"
        elif hu in ("specimen date","specimen_date","test_date","date"):
            mapping[i] = "test_date"
        elif hu in ("specimen","specimen_type","sample_type"):
            mapping[i] = "specimen_type"
        elif hu in ("organism","organism name","isolate"):
            mapping[i] = "organism"
        elif hu in ("host type","host_type","host"):
            mapping[i] = "host_type"
        elif hu in ("facility","lab","site"):
            mapping[i] = "facility"
        elif hu in ("patient type","patient_type"):
            mapping[i] = "patient_type"
        elif hu in ("animal species","animal_species"):
            mapping[i] = "animal_species"
        elif hu in ("environment type","environment_type"):
            mapping[i] = "environment_type"
        else:
            # treat as antibiotic if header token looks like common short code OR matches mapping map
            token = hu.upper().strip()
            if token in ANTIBIOTIC_CODE_MAP or (token.isalpha() and 2 <= len(token) <= 5):
                # antibiotic column
                antibiotics[i] = ANTIBIOTIC_CODE_MAP.get(token, token.title())
            else:
                # unknown column - ignore (but could be antibiotic named long e.g. "Ciprofloxacin")
                # if header contains a known drug name word, treat accordingly
                for code,canon in ANTIBIOTIC_CODE_MAP.items():
                    if code.lower() in hu or canon.lower() in hu:
                        antibiotics[i] = canon
                        break
                else:
                    mapping[i] = None
    return mapping, antibiotics

def to_iso_date(dstr):
    if not dstr: return ""
    s = str(dstr).strip()
    # try dd/mm/YYYY
    for fmt in ("%d/%m/%Y","%Y-%m-%d","%d-%m-%Y","%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except Exception:
            pass
    # fallback: return original
    return s

def convert(rows):
    if not rows:
        raise SystemExit("no rows")
    headers = rows[0]
    is_whonet = detect_whonet(headers)
    mapped, antibiotics = map_header_names(headers)
    out = []
    for r_i, row in enumerate(rows[1:], start=2):
        rowd = {i: (row[i] if i < len(row) else "") for i in range(len(headers))}
        # gather base meta using mapped fields
        base = {k: "" for k in OUT_COLS}
        for i, field in mapped.items():
            if field:
                base[field] = rowd.get(i, "")
        # If whonet, some fields are named differently: try fallback lookups
        if not base.get("patient_id"):
            # try "lab no" or "patient id" positional fallback
            for i,h in enumerate(headers):
                if h and "patient" in h.lower():
                    base["patient_id"] = rowd.get(i,""); break
        # set defaults
        if not base.get("sex"):
            base["sex"] = "U"
        # convert date
        base["test_date"] = to_iso_date(base.get("test_date","").strip())
        # organism: ensure string
        base["organism"] = (base.get("organism") or "").strip()
        # for each antibiotic column produce a row
        any_created = False
        for ai, aname in antibiotics.items():
            val = rowd.get(ai, "")
            rcanon = canon_result(val)
            if rcanon:
                o = dict(base)
                o["antibiotic"] = aname
                o["ast_result"] = rcanon
                # patient_id fallback
                if not o["patient_id"]:
                    o["patient_id"] = f"{headers[ai] or 'ROW'}-{r_i}"
                out.append(o)
                any_created = True
        # if no antibiotics matched but there is a generic antibiotic column "antibiotic"/"ast_result" treat as narrow
        if not any_created:
            # try to find narrow antibiotic columns by name
            # find col index where header equals 'antibiotic' and 'ast_result'
            try:
                idx_ab = [i for i,h in enumerate(headers) if (h or "").strip().lower()=="antibiotic"][0]
                idx_res = [i for i,h in enumerate(headers) if (h or "").strip().lower() in ("ast_result","result")][0]
                if rowd.get(idx_ab) and rowd.get(idx_res):
                    o = dict(base)
                    o["antibiotic"] = rowd[idx_ab]
                    o["ast_result"] = canon_result(rowd[idx_res])
                    out.append(o)
            except Exception:
                pass
    return out

def write_csv(out_rows, out_path):
    with out_path.open("w", newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=OUT_COLS)
        w.writeheader()
        for r in out_rows:
            w.writerow({k: r.get(k,"") for k in OUT_COLS})

def write_xlsx(out_rows, out_path):
    try:
        wb = Workbook()
        ws = wb.active
        ws.append(OUT_COLS)
        for r in out_rows:
            ws.append([r.get(c,"") for c in OUT_COLS])
        wb.save(str(out_path))
        return True
    except Exception:
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 whonet_to_template.py /path/to/whonet_file.(xlsx|csv)")
        sys.exit(2)
    p = Path(sys.argv[1])
    if not p.exists():
        print("File not found:", p)
        sys.exit(2)
    if p.suffix.lower() in (".xlsx", ".xlsm", ".xltx") and HAVE_OPENPYXL:
        rows = read_xlsx(p)
    else:
        rows = read_csv(p)
    out_rows = convert(rows)
    out_csv = p.parent / "whonet_converted.csv"
    write_csv(out_rows, out_csv)
    out_xlsx = p.parent / "whonet_converted.xlsx"
    wrote_xlsx = False
    if HAVE_OPENPYXL:
        wrote_xlsx = write_xlsx(out_rows, out_xlsx)
    print("WROTE:", out_csv, "(rows: {})".format(len(out_rows)))
    if wrote_xlsx:
        print("WROTE:", out_xlsx)
    else:
        print("(openpyxl not available: xlsx not written)")
if __name__ == "__main__":
    main()
