#!/bin/sh
set -e
set -o pipefail

cd server
rm -fR node_modules/remolacha-commons
npm install
npm run build
