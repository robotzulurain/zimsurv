#!/bin/bash
TOKEN="feb91ba9962758d186f6d011ed93bee659998aa8"
BASE="https://amr-app.onrender.com"

for path in \
  /api/summary/counts-summary/ \
  /api/summary/resistance-time-trend/ \
  /api/summary/antibiogram/ \
  /api/summary/data-quality/ \
  /api/summary/facilities-geo/ \
  /api/lab-results/
do
  echo "=== $path"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Token $TOKEN" \
    "$BASE$path"
done
