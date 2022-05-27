FROM node:18.0.0-alpine3.15 AS base

ARG NODE_ENV=production

WORKDIR /misskey

ENV BUILD_DEPS autoconf automake file g++ gcc libc-dev libtool make nasm pkgconfig python3 zlib-dev git

FROM base AS builder

COPY . ./

RUN apk add --no-cache $BUILD_DEPS && \
	git submodule update --init && \
	yarn install && \
	yarn build && \
	rm -rf .git

FROM base AS runner

RUN apk add --no-cache \
	ffmpeg \
	tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/client/node_modules ./packages/client/node_modules
COPY . ./

ENV NODE_ENV=production
CMD ["npm", "run", "migrateandstart"]

