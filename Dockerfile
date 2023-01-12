FROM node:18.13.0-bullseye AS builder

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	build-essential

WORKDIR /misskey

COPY ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]
COPY ["scripts", "./scripts"]
COPY ["packages/backend/package.json", "./packages/backend/"]
COPY ["packages/frontend/package.json", "./packages/frontend/"]
COPY ["packages/sw/package.json", "./packages/sw/"]

RUN npm i -g pnpm
RUN pnpm i --frozen-lockfile

COPY . ./

ARG NODE_ENV=production

RUN git submodule update --init
RUN pnpm build

FROM node:18.13.0-bullseye-slim AS runner

WORKDIR /misskey

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini \
	&& apt-get -y clean \
	&& rm -rf /var/lib/apt/lists/*

RUN npm i -g pnpm

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/frontend/node_modules ./packages/frontend/node_modules
COPY . ./

ENV NODE_ENV=production
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart"]
