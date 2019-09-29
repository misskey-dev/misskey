#!/bin/sh

if type yarn >> /dev/null; then
	echo "yarn is installed! using yarn."
	yarn
	NODE_ENV=production yarn build
else
	echo "yarn is not installed! using npm."
	npm i
	NODE_ENV=production npm run build
fi
