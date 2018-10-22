FROM alpine:edge AS base

ENV NODE_ENV=production

RUN apk add --no-cache nodejs nodejs-npm
RUN apk add vips fftw --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/
WORKDIR /misskey
COPY . ./

FROM base AS builder

RUN apk add --no-cache	gcc g++ python autoconf automake file make nasm
RUN apk add vips-dev fftw-dev --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/
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
