# Roadmap
The order of individual tasks is a guide only and is subject to change depending on the situation.
Also, the later tasks are more indefinite and are subject to change as development progresses.

## (1) Improve maintainability \<current stage\>
- Make the number of type errors zero (backend)
  - Probably need to switch some libraries to others that make it difficult to reduce type errors
    - e.g. koa to fastify https://github.com/misskey-dev/misskey/issues/7537
- Improve CI
  - Fix tests
    - mocha, jest, etc. do not support the combination of `TypeScript + ESM + Path alias`, and the tests currently do not work.
  - Fix random test failures - https://github.com/misskey-dev/misskey/issues/7985 and https://github.com/misskey-dev/misskey/issues/7986
  - Add more tests
    - May need to implement a mechanism that allows for DI
- Improve documentation

## (2) Improve functionality
- OAuth2 support https://github.com/misskey-dev/misskey/issues/8262

## (3) Improve scalability
- Rewriting in Rust?
