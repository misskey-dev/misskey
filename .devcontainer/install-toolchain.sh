#!/bin/bash

# Node.js は .node-version、pnpm はルートの package.json の packageManager に記載されたバージョンを導入する
# VS Code が接続前に完了を待ち、Codespaces の prebuild 更新時にも再実行されるよう updateContentCommand から実行する

set -e

. "$NVM_DIR/nvm.sh" --no-use
NVM_SYMLINK_CURRENT=true nvm install "$(cat .node-version)"
nvm alias default "$(cat .node-version)"
npm install -g "$(node -p "require('./package.json').packageManager")"
node -v
pnpm -v
