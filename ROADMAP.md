# Roadmap
The order of individual tasks is a guide only and is subject to change depending on the situation.
Also, the later tasks are more indefinite and are subject to change as development progresses.

## (1) Improve maintainability \<current phase\>
This is the phase we are at now. We need to make a high-maintenance environment that can withstand future development.

- ~~Make the number of type errors zero (backend)~~ → Done ✔️
- Make the number of type errors zero (frontend)
- Improve CI
	- ~~Fix tests~~ → Done ✔️
	- Fix random test failures - https://github.com/misskey-dev/misskey/issues/7985 and https://github.com/misskey-dev/misskey/issues/7986
	- Add more tests
		- ~~May need to implement a mechanism that allows for DI~~ → Done ✔️
			- https://github.com/misskey-dev/misskey/pull/9085
	- ~~Measure coverage~~ → Done ✔️
		- https://github.com/misskey-dev/misskey/pull/9081
- Improve documentation
- Refactoring
	- Extract the logic of each endpoint definition into a service and just call it

## (2) Improve functionality
Once Phase 1 is complete and an environment conducive to the development of a stable system is in place, the implementation of new functions can begin gradually.

- Improve features for moderation
- ~~OAuth2 support https://github.com/misskey-dev/misskey/issues/8262~~ → Done ✔️
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
