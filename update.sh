#!/bin/bash

mode=product

while getopts "d" optKey; do
  case "$optKey" in
    d)
      echo "Update as develop."
      mode=develop
      ;;
    *)
      exit
      ;;
  esac
done

case "${mode}" in
	"product")
		branch_name=m@ster
		dcyml=docker-compose.yml
		;;
	"develop")
		branch_name=m@ster-dev
		dcyml=docker-compose.dev.yml
		;;
esac

git stash
git checkout ${branch_name}
git pull
git submodule update --init
git stash pop
sudo docker-compose -f ${dcyml} pull
sudo docker-compose -f ${dcyml} stop
sudo docker-compose -f ${dcyml} up -d
