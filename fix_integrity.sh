#!/bin/bash
sed -i '/"remolacha-commons": {/!b;n;n;c"integrityDisabled": "so npm does not fail"' "$1"