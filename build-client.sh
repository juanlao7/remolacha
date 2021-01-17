#!/bin/bash
set -e
set -o pipefail

cd client
rm -fR node_modules/remolacha-commons
bash ../fix_integrity.sh package-lock.json
npm i npm-force-resolutions
npm install
npm run build
