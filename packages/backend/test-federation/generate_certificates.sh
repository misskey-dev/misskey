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
}

generate a.local
generate b.local
