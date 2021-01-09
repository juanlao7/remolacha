#!/bin/sh
set -e
set -o pipefail

cd client
rm -fR node_modules/remolacha-commons
npm install
npm run build
