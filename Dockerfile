# syntax = docker/dockerfile:1.4

# build assets & compile TypeScript

FROM --platform=$BUILDPLATFORM node:22 AS native-builder

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
	--mount=type=cache,target=/var/lib/apt,sharing=locked \
	rm -f /etc/apt/apt.conf.d/docker-clean \
	; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache \
	&& apt-get update \
	&& apt-get install -yqq --no-install-recommends \
	build-essential

WORKDIR /misskey

COPY --link pnpm-lock.yaml ./
RUN npm install -g pnpm@10
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
	pnpm fetch --ignore-scripts

COPY --link ["pnpm-workspace.yaml", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/frontend/package.json", "./packages/frontend/"]
COPY --link ["packages/sw/package.json", "./packages/sw/"]
COPY --link ["packages/misskey-js/package.json", "./packages/misskey-js/"]
COPY --link ["packages/misskey-reversi/package.json", "./packages/misskey-reversi/"]
COPY --link ["packages/misskey-bubble-game/package.json", "./packages/misskey-bubble-game/"]

RUN pnpm i --frozen-lockfile --aggregate-output --prefer-offline \
	&& pnpm rebuild -r

COPY --link . ./

RUN NODE_ENV=production pnpm build

# build native dependencies for target platform

FROM --platform=$TARGETPLATFORM node:22 AS target-builder

RUN apt-get update \
	&& apt-get install -yqq --no-install-recommends \
	build-essential

WORKDIR /misskey

COPY --link pnpm-lock.yaml ./
RUN npm install -g pnpm@10
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
	pnpm fetch --ignore-scripts

COPY --link ["pnpm-workspace.yaml", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/misskey-js/package.json", "./packages/misskey-js/"]
COPY --link ["packages/misskey-reversi/package.json", "./packages/misskey-reversi/"]
COPY --link ["packages/misskey-bubble-game/package.json", "./packages/misskey-bubble-game/"]

RUN pnpm i --frozen-lockfile --aggregate-output --prefer-offline \
	&& pnpm rebuild -r

FROM --platform=$TARGETPLATFORM node:22-slim AS runner

ARG UID="991"
ARG GID="991"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	curl ffmpeg libjemalloc-dev libjemalloc2 tini \
	&& ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so \
	&& groupadd -g "${GID}" misskey \
	&& useradd -l -u "${UID}" -g "${GID}" -m -d /misskey misskey \
	&& find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /u+s -ignore_readdir_race -exec chmod u-s {} \; \
	&& find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /g+s -ignore_readdir_race -exec chmod g-s {} \; \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists

WORKDIR /misskey

COPY --chown=misskey:misskey pnpm-lock.yaml ./
RUN npm install -g pnpm@10

COPY --chown=misskey:misskey --from=target-builder /misskey/node_modules ./node_modules
COPY --chown=misskey:misskey --from=target-builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=misskey:misskey --from=target-builder /misskey/packages/misskey-js/node_modules ./packages/misskey-js/node_modules
COPY --chown=misskey:misskey --from=target-builder /misskey/packages/misskey-reversi/node_modules ./packages/misskey-reversi/node_modules
COPY --chown=misskey:misskey --from=target-builder /misskey/packages/misskey-bubble-game/node_modules ./packages/misskey-bubble-game/node_modules
COPY --chown=misskey:misskey --from=native-builder /misskey/built ./built
COPY --chown=misskey:misskey --from=native-builder /misskey/packages/misskey-js/built ./packages/misskey-js/built
COPY --chown=misskey:misskey --from=native-builder /misskey/packages/misskey-reversi/built ./packages/misskey-reversi/built
COPY --chown=misskey:misskey --from=native-builder /misskey/packages/misskey-bubble-game/built ./packages/misskey-bubble-game/built
COPY --chown=misskey:misskey --from=native-builder /misskey/packages/backend/built ./packages/backend/built
COPY --chown=misskey:misskey --from=native-builder /misskey/fluent-emojis /misskey/fluent-emojis
COPY --chown=misskey:misskey . ./

USER misskey
ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so
ENV MALLOC_CONF=background_thread:true,metadata_thp:auto,dirty_decay_ms:30000,muzzy_decay_ms:30000
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV NODE_ENV=production
HEALTHCHECK --interval=5s --retries=20 CMD ["/bin/bash", "/misskey/healthcheck.sh"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart:docker"]
