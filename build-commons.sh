#!/bin/sh
set -e
set -o pipefail

cd commons
npm install
npm pack

