#!/usr/bin/env python3
from pathlib import Path
import csv, sys

def fix_csv(inpath: Path, outpath: Path):
    with inpath.open(newline='', encoding='utf-8') as inf:
        rdr = csv.DictReader(inf)
        rows = list(rdr)
        fieldnames = rdr.fieldnames or []
    # ensure 'age' exists
    if 'age' not in fieldnames:
        fieldnames = fieldnames + ['age']
    # fix rows
    for r in rows:
        val = (r.get('age') or '').strip()
        if val == '':
            r['age'] = '0'   # set default
    # write out
    with outpath.open('w', newline='', encoding='utf-8') as outf:
        w = csv.DictWriter(outf, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

def main():
    base = Path.home() / "amr_test_uploads"
    in_csv = base / "whonet_converted.csv"
    out_csv = base / "whonet_converted_agefixed.csv"
    if not in_csv.exists():
        print("ERROR: expected:", in_csv)
        return
    fix_csv(in_csv, out_csv)
    print("WROTE:", out_csv)
    # optionally print first few lines
    with out_csv.open(encoding='utf-8') as f:
        for i,l in enumerate(f.readline() and f, start=1):
            if i>5: break
            print(l.rstrip())

if __name__ == '__main__':
    main()
