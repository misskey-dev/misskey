process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, startServer, initTestDb, api, sleep } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import { loadConfig } from '@/config.js';
import { Blocking, BlockingsRepository, Following, FollowingsRepository, Muting, MutingsRepository, User, UsersRepository } from '@/models/index.js';
import { jobQueue } from '@/boot/common.js';
import rndstr from 'rndstr';
import { uploadFile } from '../utils.js';

describe('Account Move', () => {
	let app: INestApplicationContext;
	let url: URL;

	let root: any;
	let alice: any;
	let bob: any;
	let carol: any;
	let dave: any;
	let eve: any;
	let frank: any;

	let Users: UsersRepository;
	let Followings: FollowingsRepository;
	let Blockings: BlockingsRepository;
	let Mutings: MutingsRepository;

	beforeAll(async () => {
		app = await startServer();
		await jobQueue();
		const config = loadConfig();
		url = new URL(config.url);
		const connection = await initTestDb(false);
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
		dave = await signup({ username: 'dave' });
		eve = await signup({ username: 'eve' });
		frank = await signup({ username: 'frank' });
		Users = connection.getRepository(User);
		Followings = connection.getRepository(Following);
		Blockings = connection.getRepository(Blocking);
		Mutings = connection.getRepository(Muting);
	}, 1000 * 60 * 2);


	afterAll(async () => {
		await app.close();
	});

	describe('Create Alias', () => {
		afterEach(async () => {
			await Users.update(bob.id, { alsoKnownAs: null });
		}, 1000 * 10);

		test('Unable to add a nonexisting local account to alsoKnownAs', async () => {
			const res = await api('/i/known-as', {
				alsoKnownAs: `@nonexist@${url.hostname}`,
			}, bob);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');
		});

		test('Able to add two existing local account to alsoKnownAs', async () => {
			await api('/i/known-as', {
				alsoKnownAs: `@alice@${url.hostname}`,
			}, bob);
			await api('/i/known-as', {
				alsoKnownAs: `@carol@${url.hostname}`,
			}, bob);

			const newAlice = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newAlice.alsoKnownAs?.length, 2);
			assert.strictEqual(newAlice.alsoKnownAs[0], `${url.origin}/users/${alice.id}`);
			assert.strictEqual(newAlice.alsoKnownAs[1], `${url.origin}/users/${carol.id}`);
		});

		test('Unable to create an alias without the second @', async () => {
			const res1 = await api('/i/known-as', {
				alsoKnownAs: '@alice'
			}, bob);

			assert.strictEqual(res1.status, 400);
			assert.strictEqual(res1.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res1.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');

			const res2 = await api('/i/known-as', {
				alsoKnownAs: 'alice'
			}, bob);

			assert.strictEqual(res2.status, 400);
			assert.strictEqual(res2.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res2.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');
		});
	})

	describe('Local to Local', () => {
		let antennaId = '';

		beforeAll(async () => {
			await api('/i/known-as', {
				alsoKnownAs: `@alice@${url.hostname}`,
			}, root);
			const list = await api('/users/lists/create', {
				name: rndstr('0-9a-z', 8),
			}, root);
			await api('/users/lists/push', {
				listId: list.body.id,
				userId: alice.id,
			}, root);

			await api('/following/create', {
				userId: root.id,
			}, alice);
			await api('/following/create', {
				userId: eve.id,
			}, alice);
			const antenna = await api('/antennas/create', {
				name: rndstr('0-9a-z', 8),
				src: 'home',
				keywords: [rndstr('0-9a-z', 8)],
				excludeKeywords: [],
				users: [],
				caseSensitive: false,
				withReplies: false,
				withFile: false,
				notify: false,
			}, alice);
			antennaId = antenna.body.id;

			await api('/i/known-as', {
				alsoKnownAs: `@alice@${url.hostname}`,
			}, bob);

			await api('/following/create', {
				userId: alice.id,
			}, carol);

			await api('/mute/create', {
				userId: alice.id,
			}, dave);
			await api('/blocking/create', {
				userId: alice.id,
			}, dave);
			await api('/following/create', {
				userId: eve.id,
			}, dave);

			await api('/following/create', {
				userId: dave.id,
			}, eve);

			await api('/i/update', {
				isLocked: true,
			}, frank);
			await api('/following/create', {
				userId: frank.id,
			}, alice);
			await api('/following/requests/accept', {
				userId: alice.id,
			}, frank);
		}, 1000 * 10);

		test('Prohibit the root account from moving', async () => {
			const res = await api('/i/move', {
				moveToAccount: `@bob@${url.hostname}`
			}, root);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NOT_ROOT_FORBIDDEN');
			assert.strictEqual(res.body.error.id, '4362e8dc-731f-4ad8-a694-be2a88922a24');
		});

		test('Unable to move to a nonexisting local account', async () => {
			const res = await api('/i/move', {
				moveToAccount: `@nonexist@${url.hostname}`,
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_MOVE_TARGET');
			assert.strictEqual(res.body.error.id, 'b5c90186-4ab0-49c8-9bba-a1f76c202ba4');
		});

		test('Unable to move if alsoKnownAs is invalid', async () => {
			const res = await api('/i/move', {
				moveToAccount: `@carol@${url.hostname}`,
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'REMOTE_ACCOUNT_FORBIDS');
			assert.strictEqual(res.body.error.id, 'b5c90186-4ab0-49c8-9bba-a1f766282ba4');
		});

		test('Relationships have been properly migrated', async () => {
			const move = await api('/i/move', {
				moveToAccount: `@bob@${url.hostname}`,
			}, alice);

			assert.strictEqual(move.status, 200);

			await sleep(1000 * 1); // wait for jobs to finish

			const followings = await api('/users/following', {
				userId: carol.id,
			}, carol)
			assert.strictEqual(followings.status, 200);
			assert.strictEqual(followings.body.length, 2);
			assert.strictEqual(followings.body[0].followeeId, bob.id);
			assert.strictEqual(followings.body[1].followeeId, alice.id);

			const blockings = await api('/blocking/list', {}, dave);
			assert.strictEqual(blockings.status, 200);
			assert.strictEqual(blockings.body.length, 2);
			assert.strictEqual(blockings.body[0].blockeeId, bob.id);
			assert.strictEqual(blockings.body[1].blockeeId, alice.id);

			const mutings = await api('/mute/list', {}, dave);
			assert.strictEqual(mutings.status, 200);
			assert.strictEqual(mutings.body.length, 1);
			assert.strictEqual(mutings.body[0].muteeId, bob.id);

			const lists = await api('/users/lists/list', {}, root);
			assert.strictEqual(lists.status, 200);
			assert.strictEqual(lists.body[0].userIds.length, 1);
			assert.strictEqual(lists.body[0].userIds[0], bob.id);
		});

		test('Follow and follower counts are properly adjusted', async () => {
			await api('/following/create', {
				userId: alice.id,
			}, eve);
			const newAlice = await Users.findOneByOrFail({ id: alice.id });
			const newCarol = await Users.findOneByOrFail({ id: carol.id });
			let newEve = await Users.findOneByOrFail({ id: eve.id });
			assert.strictEqual(newAlice.movedToUri, `${url.origin}/users/${bob.id}`);
			assert.strictEqual(newAlice.followingCount, 0);
			assert.strictEqual(newAlice.followersCount, 0);
			assert.strictEqual(newCarol.followingCount, 1);
			assert.strictEqual(newEve.followingCount, 1);
			assert.strictEqual(newEve.followersCount, 1);

			await api('/following/delete', {
				userId: alice.id,
			}, eve);
			newEve = await Users.findOneByOrFail({ id: eve.id });
			assert.strictEqual(newEve.followingCount, 1);
			assert.strictEqual(newEve.followersCount, 1);
		});

		test('A locked account automatically accept the follow request if it had already accepted the old account.', async () => {
			await api('/following/create', {
				userId: frank.id,
			}, bob);
			const followers = await api('/users/followers', {
				userId: frank.id,
			}, frank);

			assert.strictEqual(followers.status, 200);
			assert.strictEqual(followers.body.length, 2);
			assert.strictEqual(followers.body[0].followerId, bob.id);
		});

		test.each([
			'/antennas/create',
			'/channels/create',
			'/channels/favorite',
			'/channels/follow',
			'/channels/unfavorite',
			'/channels/unfollow',
			'/clips/add-note',
			'/clips/create',
			'/clips/favorite',
			'/clips/remove-note',
			'/clips/unfavorite',
			'/clips/update',
			'/drive/files/upload-from-url',
			'/flash/create',
			'/flash/like',
			'/flash/unlike',
			'/flash/update',
			'/following/create',
			'/gallery/posts/create',
			'/gallery/posts/like',
			'/gallery/posts/unlike',
			'/gallery/posts/update',
			'/i/known-as',
			'/i/move',
			'/notes/create',
			'/notes/polls/vote',
			'/notes/reactions/create',
			'/pages/create',
			'/pages/like',
			'/pages/unlike',
			'/pages/update',
			'/users/lists/create',
			'/users/lists/pull',
			'/users/lists/push',
			'/users/lists/update',
		])('Prohibit access after moving: %s', async (endpoint) => {
			const res = await api(endpoint, {}, alice);
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual(res.body.error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});

		test('Prohibit access after moving: /antennas/update', async () => {
			const res = await api('/antennas/update', {
				antennaId,
				name: rndstr('0-9a-z', 8),
				src: 'users',
				keywords: [rndstr('0-9a-z', 8)],
				excludeKeywords: [],
				users: [eve.id],
				caseSensitive: false,
				withReplies: false,
				withFile: false,
				notify: false,
			}, alice);

			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual(res.body.error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});

		test('Prohibit access after moving: /drive/files/create', async () => {
			const res = await uploadFile(alice);

			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual(res.body.error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});
	});
});
