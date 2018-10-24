FROM alpine:3.8 AS base

ENV NODE_ENV=production

RUN apk add --no-cache nodejs nodejs-npm zlib
WORKDIR /misskey
COPY . ./

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
RUN npm install \
    && npm install -g node-gyp \
    && node-gyp configure \
    && node-gyp build \
    && npm run build

FROM base AS runner

COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/node_modules ./node_modules

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
