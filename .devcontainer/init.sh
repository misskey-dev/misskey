#!/bin/bash

set -xe

git submodule update --init
npm ci
cp .devcontainer/devcontainer.yml .config/default.yml
npm run build
npm run migrate
