FROM node:16.17.1-bullseye AS builder

ARG NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	build-essential

WORKDIR /misskey

COPY [".npmrc", ".yarnrc", "package.json", "yarn.lock", "./"]
COPY ["scripts", "./scripts"]
COPY ["packages/backend/.npmrc", "packages/backend/.yarnrc", "packages/backend/package.json", "packages/backend/yarn.lock", "./packages/backend/"]
COPY ["packages/client/.npmrc", "packages/client/.yarnrc", "packages/client/package.json", "packages/client/yarn.lock", "./packages/client/"]
COPY ["packages/sw/.npmrc", "packages/sw/.yarnrc", "packages/sw/package.json", "packages/sw/yarn.lock", "./packages/sw/"]

RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn build

FROM node:16.17.1-bullseye-slim AS runner

WORKDIR /misskey

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini \
	&& apt-get -y clean \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/client/node_modules ./packages/client/node_modules
COPY . ./

ENV NODE_ENV=production
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "migrateandstart"]
