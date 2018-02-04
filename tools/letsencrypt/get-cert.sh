#!/bin/sh

certbot certonly --standalone\
  -d $1\
  -d api.$1\
  -d auth.$1\
  -d docs.$1\
  -d ch.$1\
  -d stats.$1\
  -d status.$1\
  -d dev.$1\
  -d file.$2\
