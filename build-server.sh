#!/bin/bash
set -e
set -o pipefail

cd server
rm -fR node_modules/remolacha-commons
bash ../fix_integrity.sh package-lock.json
npm install
npm run build
