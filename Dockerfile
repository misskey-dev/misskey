FROM node:11-alpine AS base

ENV NODE_ENV=production

RUN npm i -g npm@latest

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
    python \
    zlib-dev
RUN npm i -g yarn

COPY . ./
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

CMD ["npm", "start"]
