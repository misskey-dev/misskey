#!/bin/bash
mkdir certificates

# rootCA
openssl genrsa -des3 \
  -passout pass:rootCA \
  -out certificates/rootCA.key 4096
openssl req -x509 -new -nodes -batch \
  -key certificates/rootCA.key \
  -sha256 \
  -days 1024 \
  -passin pass:rootCA \
  -out certificates/rootCA.crt

# domain
function generate {
  openssl req -new -newkey rsa:2048 -sha256 -nodes \
    -keyout certificates/$1.key \
    -subj "/CN=$1/emailAddress=admin@$1/C=JP/ST=/L=/O=Misskey Tester/OU=Some Unit" \
    -out certificates/$1.csr
  openssl x509 -req -sha256 \
    -in certificates/$1.csr \
    -CA certificates/rootCA.crt \
    -CAkey certificates/rootCA.key \
    -CAcreateserial \
    -passin pass:rootCA \
    -out certificates/$1.crt \
    -days 500
  if [ ! -f .config/docker.env ]; then cp .config/example.docker.env .config/docker.env; fi
  if [ ! -f .config/$1.conf ]; then sed "s/\${HOST}/$1/g" .config/example.conf > .config/$1.conf; fi
  if [ ! -f .config/$1.default.yml ]; then sed "s/\${HOST}/$1/g" .config/example.default.yml > .config/$1.default.yml; fi
}

generate a.test
generate b.test
