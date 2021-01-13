#!/bin/sh
set -e
set -o pipefail

echo
echo BUILDING COMMONS
echo
bash build-commons.sh

echo
echo BUILDING CLIENT
echo
bash build-client.sh

echo
echo BUILDING SERVER
echo
bash build-server.sh
