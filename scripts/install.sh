#!/usr/bin/env bash
# Install dependencies after a change to package.json. Arguments go to pnpm install.
# A fresh checkout does not need this: a booth restores node_modules from the
# image's pnpm cache when it starts (.booth/startup.sh).
source "$(dirname "$0")/_booth.sh"

pnpm install "$@"
