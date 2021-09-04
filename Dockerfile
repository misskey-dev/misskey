FROM node:16-alpine AS base

ENV NODE_ENV=production

WORKDIR /misskey

FROM base AS builder

RUN apk add --no-cache \
    autoconf \
    automake \
    file \
    g++ \
    gcc \
    libc-dev \
    libtool \
    make \
    nasm \
    pkgconfig \
    python3 \
    zlib-dev \
    git

COPY . ./
RUN git submodule update --init
RUN yarn install
RUN yarn build

FROM base AS runner

RUN apk add --no-cache \
    ffmpeg \
    tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY . ./

CMD ["npm", "run", "migrateandstart"]
