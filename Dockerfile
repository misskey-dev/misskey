# Use latest LTS
FROM node:8.9.4-alpine

RUN apk add --no-cache graphicsmagick

WORKDIR /app
COPY . /app

ARG node_env=production
ENV NODE_ENV $node_env

RUN apk add --no-cache --virtual build-requirements \
python2 autoconf automake build-base file nasm libpng-dev && \
env NODE_ENV= npm install && \
apk del --purge build-requirements && \
npm run build && \
npm prune

CMD ["npm", "start"]
