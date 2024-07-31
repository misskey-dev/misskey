#!/bin/bash

set -xe

sudo chown node node_modules
git config --global --add safe.directory /workspace
git submodule update --init
corepack install
corepack enable
pnpm config set store-dir /home/node/.local/share/pnpm/store
pnpm install --frozen-lockfile
cp .devcontainer/devcontainer.yml .config/default.yml
pnpm build
pnpm migrate
