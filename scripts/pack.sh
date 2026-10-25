#!/usr/bin/env bash
# Pack @geekpresent/core into .pack/geekpresent-core-<version>.tgz (see utils/pack-core.mjs).
source "$(dirname "$0")/_booth.sh"

node utils/pack-core.mjs "$@"
