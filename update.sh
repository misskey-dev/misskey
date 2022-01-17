#!/bin/bash

branch_name=m@ster

while getopts "d" optKey; do
  case "$optKey" in
    d)
      echo "Update as develop."
      branch_name=m@ster-dev
      ;;
    *)
      exit
      ;;
  esac
done

git stash
git checkout ${branch_name}
git pull
git submodule update --init
git stash pop
sudo docker-compose pull
sudo docker-compose stop && sudo docker-compose up -d
