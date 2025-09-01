#!/bin/bash
BASE="https://amr-app.onrender.com"
echo "GET /"
curl -s $BASE | jq
echo
echo "GET /healthz"
curl -s $BASE/healthz | jq
