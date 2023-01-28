#!/bin/bash

PORT=$(yq '.port' /misskey/.config/default.yml)
curl -s -S -o /dev/null "http://localhost:${PORT}"
