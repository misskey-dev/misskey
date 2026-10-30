/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { beforeAll, describe, test } from 'vitest';
import { api, failedApiCall, role, signup, successfulApiCall } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('デフォルトでフォローするユーザー / 交流を断てないユーザー', () => {
	let root: misskey.entities.SignupResponse;
	let defaultFollowee: misskey.entities.SignupResponse;
	let forciblyFollowee: misskey.entities.SignupResponse;
	let alice: misskey.entities.SignupResponse;
	let moderator: misskey.entities.SignupResponse;

	const isFollowing = async (follower: misskey.entities.SignupResponse, followee: misskey.entities.SignupResponse) => {
		const res = await api('users/relation', { userId: followee.id }, follower);
		assert.strictEqual(res.status, 200);
		assert.ok(!Array.isArray(res.body));
		return res.body.isFollowing;
	};

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		defaultFollowee = await signup({ username: 'defaultFollowee' });
		forciblyFollowee = await signup({ username: 'forciblyFollowee' });

		await successfulApiCall({
			endpoint: 'admin/update-meta',
			parameters: {
				// 存在しないユーザーが含まれていてもサインアップは成功する必要がある
				defaultFollowedUsers: [defaultFollowee.id, '0000000000000000'],
				forciblyFollowedUsers: [forciblyFollowee.id],
			},
			user: root,
		});

		alice = await signup({ username: 'alice' });
		moderator = await signup({ username: 'moderator' });
		const moderatorRole = await role(root, { isModerator: true, name: 'Moderator Role' });
		await api('admin/roles/assign', { userId: moderator.id, roleId: moderatorRole.id }, root);
	}, 1000 * 60 * 2);

	describe('admin/update-meta', () => {
		test('同一リクエスト内で両方に同じユーザーを指定するとエラーになる', async () => {
			await failedApiCall({
				endpoint: 'admin/update-meta',
				parameters: {
					defaultFollowedUsers: [alice.id],
					forciblyFollowedUsers: [alice.id],
				},
				user: root,
			}, {
				status: 400,
				code: 'FOLLOWED_USER_DUPLICATED',
				id: 'bcf088ec-fec5-42d0-8b9e-16d3b4797a4d',
			});
		});

		test('同一リクエスト内でデフォルトでフォローするユーザーから交流を断てないユーザーへ移動できる', async () => {
			await successfulApiCall({
				endpoint: 'admin/update-meta',
				parameters: {
					defaultFollowedUsers: [defaultFollowee.id],
					forciblyFollowedUsers: [forciblyFollowee.id, '0000000000000000'],
				},
				user: root,
			});

			const res = await successfulApiCall({ endpoint: 'admin/meta', parameters: {}, user: root });
			assert.deepStrictEqual(res.defaultFollowedUsers, [defaultFollowee.id]);
			assert.deepStrictEqual(res.forciblyFollowedUsers, [forciblyFollowee.id, '0000000000000000']);
		});

		test('設定済みの交流を断てないユーザーをデフォルトでフォローするユーザーに指定するとエラーになる', async () => {
			await failedApiCall({
				endpoint: 'admin/update-meta',
				parameters: {
					defaultFollowedUsers: [defaultFollowee.id, forciblyFollowee.id],
				},
				user: root,
			}, {
				status: 400,
				code: 'FOLLOWED_USER_DUPLICATED',
				id: 'bcf088ec-fec5-42d0-8b9e-16d3b4797a4d',
			});
		});
	});

	test('新規アカウントは両方のユーザーを自動でフォローする', async () => {
		assert.strictEqual(await isFollowing(alice, defaultFollowee), true);
		assert.strictEqual(await isFollowing(alice, forciblyFollowee), true);
	});

	describe('交流を断てないユーザーに対する操作', () => {
		test('フォロー解除できない', async () => {
			await failedApiCall({
				endpoint: 'following/delete',
				parameters: { userId: forciblyFollowee.id },
				user: alice,
			}, {
				status: 403,
				code: 'CANNOT_UNFOLLOW_DUE_TO_SERVER_POLICY',
				id: '19f25f61-0141-4683-99dc-217a88d633cb',
			});
			assert.strictEqual(await isFollowing(alice, forciblyFollowee), true);
		});

		test('ブロックできない', async () => {
			await failedApiCall({
				endpoint: 'blocking/create',
				parameters: { userId: forciblyFollowee.id },
				user: alice,
			}, {
				status: 403,
				code: 'CANNOT_BLOCK_DUE_TO_SERVER_POLICY',
				id: 'e2f04d25-0d94-4ac3-a4d8-ba401062741b',
			});
			assert.strictEqual(await isFollowing(alice, forciblyFollowee), true);
		});

		test('ミュートできない', async () => {
			await failedApiCall({
				endpoint: 'mute/create',
				parameters: { userId: forciblyFollowee.id },
				user: alice,
			}, {
				status: 403,
				code: 'CANNOT_MUTE_DUE_TO_SERVER_POLICY',
				id: '15273a89-374d-49fa-8df6-8bb3feeea455',
			});
		});

		test('リノートミュートできない', async () => {
			await failedApiCall({
				endpoint: 'renote-mute/create',
				parameters: { userId: forciblyFollowee.id },
				user: alice,
			}, {
				status: 403,
				code: 'CANNOT_MUTE_DUE_TO_SERVER_POLICY',
				id: '15273a89-374d-49fa-8df6-8bb3feeea455',
			});
		});

		test('交流を断てないユーザー側からもブロックできない', async () => {
			await failedApiCall({
				endpoint: 'blocking/create',
				parameters: { userId: alice.id },
				user: forciblyFollowee,
			}, {
				status: 403,
				code: 'CANNOT_BLOCK_DUE_TO_SERVER_POLICY',
				id: 'e2f04d25-0d94-4ac3-a4d8-ba401062741b',
			});
			assert.strictEqual(await isFollowing(alice, forciblyFollowee), true);
		});

		test('交流を断てないユーザー側からもフォロワーを解除できない', async () => {
			await failedApiCall({
				endpoint: 'following/invalidate',
				parameters: { userId: alice.id },
				user: forciblyFollowee,
			}, {
				status: 403,
				code: 'CANNOT_BREAK_FOLLOW_DUE_TO_SERVER_POLICY',
				id: '0cb6fb08-355c-40af-b176-4a6ba136c390',
			});
			assert.strictEqual(await isFollowing(alice, forciblyFollowee), true);
		});

		test('モデレーターはブロックできる', async () => {
			await successfulApiCall({
				endpoint: 'blocking/create',
				parameters: { userId: forciblyFollowee.id },
				user: moderator,
			});
			assert.strictEqual(await isFollowing(moderator, forciblyFollowee), false);
		});
	});

	test('デフォルトでフォローするユーザーはフォロー解除できる', async () => {
		await successfulApiCall({
			endpoint: 'following/delete',
			parameters: { userId: defaultFollowee.id },
			user: alice,
		});
		assert.strictEqual(await isFollowing(alice, defaultFollowee), false);
	});
});
