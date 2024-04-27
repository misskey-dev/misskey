/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { INestApplicationContext } from '@nestjs/common';

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { loadConfig } from '@/config.js';
import { MiUser, UsersRepository } from '@/models/_.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { jobQueue } from '@/boot/common.js';
import { api, initTestDb, signup, sleep, successfulApiCall, uploadFile } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Account Move', () => {
	let jq: INestApplicationContext;
	let url: URL;

	let root: any;
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;
	let carol: misskey.entities.SignupResponse;
	let dave: misskey.entities.SignupResponse;
	let eve: misskey.entities.SignupResponse;
	let frank: misskey.entities.SignupResponse;

	let Users: UsersRepository;

	beforeAll(async () => {
		jq = await jobQueue();

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
		Users = connection.getRepository(MiUser);
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await jq.close();
	});

	describe('Create Alias', () => {
		afterEach(async () => {
			await Users.update(bob.id, { alsoKnownAs: null });
		}, 1000 * 10);

		test('Able to create an alias', async () => {
			const res = await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`],
			}, bob);

			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.alsoKnownAs?.length, 1);
			assert.strictEqual(newBob.alsoKnownAs[0], `${url.origin}/users/${alice.id}`);
			assert.strictEqual(res.body.alsoKnownAs?.length, 1);
			assert.strictEqual(res.body.alsoKnownAs[0], alice.id);
		});

		test('Able to create a local alias without hostname', async () => {
			await api('i/update', {
				alsoKnownAs: ['@alice'],
			}, bob);

			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.alsoKnownAs?.length, 1);
			assert.strictEqual(newBob.alsoKnownAs[0], `${url.origin}/users/${alice.id}`);
		});

		test('Able to create a local alias without @', async () => {
			await api('i/update', {
				alsoKnownAs: ['alice'],
			}, bob);

			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.alsoKnownAs?.length, 1);
			assert.strictEqual(newBob.alsoKnownAs[0], `${url.origin}/users/${alice.id}`);
		});

		test('Able to set remote user (but may fail)', async () => {
			const res = await api('i/update', {
				alsoKnownAs: ['@syuilo@example.com'],
			}, bob);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');
		});

		test('Unable to add duplicated aliases to alsoKnownAs', async () => {
			const res = await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`, `@alice@${url.hostname}`],
			}, bob);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'INVALID_PARAM');
			assert.strictEqual(res.body.error.id, '3d81ceae-475f-4600-b2a8-2bc116157532');
		});

		test('Unable to add itself', async () => {
			const res = await api('i/update', {
				alsoKnownAs: [`@bob@${url.hostname}`],
			}, bob);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'FORBIDDEN_TO_SET_YOURSELF');
			assert.strictEqual(res.body.error.id, '25c90186-4ab0-49c8-9bba-a1fa6c202ba4');
		});

		test('Unable to add a nonexisting local account to alsoKnownAs', async () => {
			const res1 = await api('i/update', {
				alsoKnownAs: [`@nonexist@${url.hostname}`],
			}, bob);

			assert.strictEqual(res1.status, 400);
			assert.strictEqual(res1.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res1.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');

			const res2 = await api('i/update', {
				alsoKnownAs: ['@alice', 'nonexist'],
			}, bob);

			assert.strictEqual(res2.status, 400);
			assert.strictEqual(res2.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res2.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');
		});

		test('Able to add two existing local account to alsoKnownAs', async () => {
			await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`, `@carol@${url.hostname}`],
			}, bob);

			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.alsoKnownAs?.length, 2);
			assert.strictEqual(newBob.alsoKnownAs[0], `${url.origin}/users/${alice.id}`);
			assert.strictEqual(newBob.alsoKnownAs[1], `${url.origin}/users/${carol.id}`);
		});

		test('Able to properly overwrite alsoKnownAs', async () => {
			await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`],
			}, bob);
			await api('i/update', {
				alsoKnownAs: [`@carol@${url.hostname}`, `@dave@${url.hostname}`],
			}, bob);

			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.alsoKnownAs?.length, 2);
			assert.strictEqual(newBob.alsoKnownAs[0], `${url.origin}/users/${carol.id}`);
			assert.strictEqual(newBob.alsoKnownAs[1], `${url.origin}/users/${dave.id}`);
		});
	});

	describe('Local to Local', () => {
		let antennaId = '';

		beforeAll(async () => {
			await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`],
			}, root);
			const listRoot = await api('users/lists/create', {
				name: secureRndstr(8),
			}, root);
			await api('users/lists/push', {
				listId: listRoot.body.id,
				userId: alice.id,
			}, root);

			await api('following/create', {
				userId: root.id,
			}, alice);
			await api('following/create', {
				userId: eve.id,
			}, alice);
			const antenna = await api('antennas/create', {
				name: secureRndstr(8),
				src: 'home',
				keywords: [[secureRndstr(8)]],
				excludeKeywords: [],
				users: [],
				caseSensitive: false,
				localOnly: false,
				withReplies: false,
				withFile: false,
				notify: false,
			}, alice);
			antennaId = antenna.body.id;

			await api('i/update', {
				alsoKnownAs: [`@alice@${url.hostname}`],
			}, bob);

			await api('following/create', {
				userId: alice.id,
			}, carol);

			await api('mute/create', {
				userId: alice.id,
			}, dave);
			await api('blocking/create', {
				userId: alice.id,
			}, dave);
			await api('following/create', {
				userId: eve.id,
			}, dave);

			await api('following/create', {
				userId: dave.id,
			}, eve);
			const listEve = await api('users/lists/create', {
				name: secureRndstr(8),
			}, eve);
			await api('users/lists/push', {
				listId: listEve.body.id,
				userId: bob.id,
			}, eve);

			await api('i/update', {
				isLocked: true,
			}, frank);
			await api('following/create', {
				userId: frank.id,
			}, alice);
			await api('following/requests/accept', {
				userId: alice.id,
			}, frank);
		}, 1000 * 10);

		test('Prohibit the root account from moving', async () => {
			const res = await api('i/move', {
				moveToAccount: `@bob@${url.hostname}`,
			}, root);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NOT_ROOT_FORBIDDEN');
			assert.strictEqual(res.body.error.id, '4362e8dc-731f-4ad8-a694-be2a88922a24');
		});

		test('Unable to move to a nonexisting local account', async () => {
			const res = await api('i/move', {
				moveToAccount: `@nonexist@${url.hostname}`,
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_USER');
			assert.strictEqual(res.body.error.id, 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5');
		});

		test('Unable to move if alsoKnownAs is invalid', async () => {
			const res = await api('i/move', {
				moveToAccount: `@carol@${url.hostname}`,
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'DESTINATION_ACCOUNT_FORBIDS');
			assert.strictEqual(res.body.error.id, 'b5c90186-4ab0-49c8-9bba-a1f766282ba4');
		});

		test('Relationships have been properly migrated', async () => {
			const move = await api('i/move', {
				moveToAccount: `@bob@${url.hostname}`,
			}, alice);

			assert.strictEqual(move.status, 200);

			await sleep(1000 * 3); // wait for jobs to finish

			// Unfollow delayed?
			const aliceFollowings = await api('users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(aliceFollowings.status, 200);
			assert.strictEqual(aliceFollowings.body.length, 3);

			const carolFollowings = await api('users/following', {
				userId: carol.id,
			}, carol);
			assert.strictEqual(carolFollowings.status, 200);
			assert.strictEqual(carolFollowings.body.length, 2);
			assert.strictEqual(carolFollowings.body[0].followeeId, bob.id);
			assert.strictEqual(carolFollowings.body[1].followeeId, alice.id);

			const blockings = await api('blocking/list', {}, dave);
			assert.strictEqual(blockings.status, 200);
			assert.strictEqual(blockings.body.length, 2);
			assert.strictEqual(blockings.body[0].blockeeId, bob.id);
			assert.strictEqual(blockings.body[1].blockeeId, alice.id);

			const mutings = await api('mute/list', {}, dave);
			assert.strictEqual(mutings.status, 200);
			assert.strictEqual(mutings.body.length, 2);
			assert.strictEqual(mutings.body[0].muteeId, bob.id);
			assert.strictEqual(mutings.body[1].muteeId, alice.id);

			const rootLists = await api('users/lists/list', {}, root);
			assert.strictEqual(rootLists.status, 200);
			assert.strictEqual(rootLists.body[0].userIds.length, 2);
			assert.ok(rootLists.body[0].userIds.find((id: string) => id === bob.id));
			assert.ok(rootLists.body[0].userIds.find((id: string) => id === alice.id));

			const eveLists = await api('users/lists/list', {}, eve);
			assert.strictEqual(eveLists.status, 200);
			assert.strictEqual(eveLists.body[0].userIds.length, 1);
			assert.ok(eveLists.body[0].userIds.find((id: string) => id === bob.id));
		});

		test('A locked account automatically accept the follow request if it had already accepted the old account.', async () => {
			await successfulApiCall({
				endpoint: 'following/create',
				parameters: {
					userId: frank.id,
				},
				user: bob,
			});
			const followers = await api('users/followers', {
				userId: frank.id,
			}, frank);

			assert.strictEqual(followers.status, 200);
			assert.strictEqual(followers.body.length, 2);
			assert.strictEqual(followers.body[0].followerId, bob.id);
		});

		test('Unfollowed after 10 sec (24 hours in production).', async () => {
			await sleep(1000 * 8);

			const following = await api('users/following', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(following.status, 200);
			assert.strictEqual(following.body.length, 0);
		});

		test('Unable to move if the destination account has already moved.', async () => {
			const res = await api('i/move', {
				moveToAccount: `@alice@${url.hostname}`,
			}, bob);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'DESTINATION_ACCOUNT_FORBIDS');
			assert.strictEqual(res.body.error.id, 'b5c90186-4ab0-49c8-9bba-a1f766282ba4');
		});

		test('Follow and follower counts are properly adjusted', async () => {
			await api('following/create', {
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

			await api('following/delete', {
				userId: alice.id,
			}, eve);
			newEve = await Users.findOneByOrFail({ id: eve.id });
			assert.strictEqual(newEve.followingCount, 1);
			assert.strictEqual(newEve.followersCount, 1);
		});

		test.each([
			'antennas/create',
			'channels/create',
			'channels/favorite',
			'channels/follow',
			'channels/unfavorite',
			'channels/unfollow',
			'clips/add-note',
			'clips/create',
			'clips/favorite',
			'clips/remove-note',
			'clips/unfavorite',
			'clips/update',
			'drive/files/upload-from-url',
			'flash/create',
			'flash/like',
			'flash/unlike',
			'flash/update',
			'following/create',
			'gallery/posts/create',
			'gallery/posts/like',
			'gallery/posts/unlike',
			'gallery/posts/update',
			'i/claim-achievement',
			'i/move',
			'i/import-blocking',
			'i/import-following',
			'i/import-muting',
			'i/import-user-lists',
			'i/pin',
			'mute/create',
			'notes/create',
			'notes/favorites/create',
			'notes/polls/vote',
			'notes/reactions/create',
			'pages/create',
			'pages/like',
			'pages/unlike',
			'pages/update',
			'renote-mute/create',
			'users/lists/create',
			'users/lists/pull',
			'users/lists/push',
		] as const)('Prohibit access after moving: %s', async (endpoint) => {
			const res = await api(endpoint, {}, alice);
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual(res.body.error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});

		test('Prohibit access after moving: /antennas/update', async () => {
			const res = await api('antennas/update', {
				antennaId,
				name: secureRndstr(8),
				src: 'users',
				keywords: [[secureRndstr(8)]],
				excludeKeywords: [],
				users: [eve.id],
				caseSensitive: false,
				localOnly: false,
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
			assert.strictEqual((res.body! as any as { error: misskey.api.APIError }).error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual((res.body! as any as { error: misskey.api.APIError }).error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});

		test('Prohibit updating alsoKnownAs after moving', async () => {
			const res = await api('i/update', {
				alsoKnownAs: [`@eve@${url.hostname}`],
			}, alice);

			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_MOVED');
			assert.strictEqual(res.body.error.id, '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31');
		});
	});
});
