FROM node:16.15.1-bullseye AS builder

ARG NODE_ENV=production

WORKDIR /misskey

COPY . ./

RUN apt-get update
RUN apt-get install -y build-essential
RUN git submodule update --init
RUN yarn install
RUN yarn build
RUN rm -rf .git

FROM node:16.15.1-bullseye-slim AS runner

WORKDIR /misskey

RUN apt-get update
RUN apt-get install -y ffmpeg tini

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/client/node_modules ./packages/client/node_modules
COPY . ./

ENV NODE_ENV=production
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "migrateandstart"]
