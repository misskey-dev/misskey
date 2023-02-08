#!/bin/bash

PORT=$(grep '^port:' /misskey/.config/default.yml | awk 'NR==1{print $2; exit}')
curl -s -S -o /dev/null "http://localhost:${PORT}"
