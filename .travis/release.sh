#!/bin/bash

if [ $TRAVIS_BRANCH = "master" ] && [ $TRAVIS_PULL_REQUEST != "false" ]; then
  echo "Starting releasing task"
  openssl aes-256-cbc -K $encrypted_ceda82069128_key -iv $encrypted_ceda82069128_iv -in ./.travis/travis_rsa.enc -out travis_rsa -d
  cp travis_rsa ~/.ssh/id_rsa
  chmod 600 ~/.ssh/id_rsa
  echo -e "Host github.com\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
  git checkout -b release
  cp -f ./.travis/.gitignore-release .gitignore
  git add --all
  git rm --cached `git ls-files --full-name -i --exclude-standard`
  git config --global user.email "AyaMorisawa4869@gmail.com"
  git config --global user.name "Aya Morisawa"
  git commit -m "Release build for $TRAVIS_COMMIT"
  git push -f git@github.com:syuilo/misskey release
  echo "Finished releasing task"
else
  echo "Skipping releasing task"
fi
