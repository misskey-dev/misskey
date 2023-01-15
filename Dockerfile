ARG NODE_VERSION=18.13.0-bullseye

FROM node:${NODE_VERSION} AS builder

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

FROM node:${NODE_VERSION}-slim AS runner

ARG UID="991"
ARG GID="991"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini \
	&& apt-get -y clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& groupadd -g "${GID}" misskey \
	&& useradd -l -u "${UID}" -g "${GID}" -m -d /misskey misskey

USER misskey
WORKDIR /misskey

COPY --chown=misskey:misskey --from=builder /misskey/.yarn/install-state.gz ./.yarn/install-state.gz
COPY --chown=misskey:misskey --from=builder /misskey/node_modules ./node_modules
COPY --chown=misskey:misskey --from=builder /misskey/built ./built
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --chown=misskey:misskey --from=builder /misskey/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --chown=misskey:misskey . ./

ENV NODE_ENV=production
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["yarn", "run", "migrateandstart"]
