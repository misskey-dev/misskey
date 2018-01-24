# Use latest LTS
FROM node:8.9.4-alpine

ARG node_env=production

WORKDIR /app
COPY . /app

RUN apk add --no-cache graphicsmagick

RUN apk add --no-cache --virtual build-requirements \
python2 autoconf automake build-base file nasm libpng-dev && \
npm install && \
apk del --purge build-requirements && \
env NODE_ENV=$node_env npm run build && \
env NODE_ENV=$node_env npm prune

ENV NODE_ENV $node_env
CMD ["npm", "start"]
