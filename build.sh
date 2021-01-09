#!/bin/sh
set -e
set -o pipefail

echo
echo BUILDING COMMONS
echo
sh build-commons.sh

echo
echo BUILDING CLIENT
echo
sh build-client.sh

echo
echo BUILDING SERVER
echo
sh build-server.sh
