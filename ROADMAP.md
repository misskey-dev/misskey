# Roadmap
The order of individual tasks is a guide only and is subject to change depending on the situation.
Also, the later tasks are more indefinite and are subject to change as development progresses.

## (1) Improve maintainability \<current phase\>
This is the phase we are at now. We need to make a high-maintenance environment that can withstand future development.

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
Once Phase 1 is complete and an environment conducive to the development of a stable system is in place, the implementation of new functions can begin gradually.

- OAuth2 support https://github.com/misskey-dev/misskey/issues/8262
- GraphQL support?

## (3) Improve scalability
Once the development of the feature has settled down, this may be an opportunity to make larger modifications.

- Rewriting in Rust?

## (4) Change the world
It is time to promote Misskey and change the world.

- Become more major than services such as Twitter and become critical infrastructure for the world
- MiOS will be developed and integrated into various systems - What is MiOS?
- Letting Ai-chan interfere with the real world
- Make Misskey a member of GAFA; Misskey's office must be a reinforced concrete brutalist building with a courtyard.
