FROM node:18.13.0-bullseye AS builder

ARG NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	build-essential

WORKDIR /misskey

COPY [".yarnrc.yml", "package.json", "yarn.lock", "./"]
COPY [".yarn", "./.yarn"]
COPY ["scripts", "./scripts"]
COPY ["packages/backend/package.json", "./packages/backend/"]
COPY ["packages/frontend/package.json", "./packages/frontend/"]
COPY ["packages/sw/package.json", "./packages/sw/"]

RUN yarn install --immutable

COPY . ./

RUN git submodule update --init
RUN yarn build

FROM node:18.13.0-bullseye-slim AS runner

WORKDIR /misskey

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini \
	&& apt-get -y clean \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder /misskey/.yarn/install-state.gz ./.yarn/install-state.gz
COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/frontend/node_modules ./packages/frontend/node_modules
COPY . ./

ENV NODE_ENV=production
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["yarn", "run", "migrateandstart"]
