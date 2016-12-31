#!/bin/sh
redis-server --daemonize yes
mongod > /dev/null &
cd /root/misskey
npm start
tail -f /dev/null
