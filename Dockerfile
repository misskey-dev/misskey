FROM alpine:3.8 AS base

ENV NODE_ENV=production

RUN apk add --no-cache nodejs nodejs-npm zlib
RUN npm i -g npm@latest

WORKDIR /misskey

FROM base AS builder

RUN apk add --no-cache \
    gcc \
    g++ \
    libc-dev \
    python \
    autoconf \
    automake \
    file \
    make \
    nasm \
    pkgconfig \
    libtool \
    zlib-dev
RUN npm i -g node-gyp

COPY ./package.json ./
RUN npm i

COPY . ./
RUN node-gyp configure \
 && node-gyp build \
 && npm run build

FROM base AS runner

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY . ./

CMD ["npm", "start"]
