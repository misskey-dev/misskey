#!/bin/bash

set -xe

sudo chown -R node /workspace
git submodule update --init
pnpm install --frozen-lockfile
cp .devcontainer/devcontainer.yml .config/default.yml
pnpm build
pnpm migrate
