/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, startServer, simpleGet } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('FF visibility', () => {
	let app: INestApplicationContext;

	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('followingVisibility, followerVisibility がともに public なユーザーのフォロー/フォロワーを誰でも見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'public',
			followerVisibility: 'public',
		}, alice);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	test('followingVisibility が public であれば followerVisibility の設定に関わらずユーザーのフォローを誰でも見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followerVisibility が public であれば followingVisibility の設定に関わらずユーザーのフォロワーを誰でも見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'public',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'public',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'public',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followerVisibility がともに followers なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followerVisibility: 'followers',
		}, alice);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, alice);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, alice);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	test('followingVisibility が followers なユーザーのフォローを followerVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followerVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followerVisibility がともに followers なユーザーのフォロー/フォロワーを非フォロワーが見れない', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followerVisibility: 'followers',
		}, alice);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 400);
		assert.strictEqual(followersRes.status, 400);
	});

	test('followingVisibility が followers なユーザーのフォローを followerVisibility の設定に関わらず非フォロワーが見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
	});

	test('followerVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらず非フォロワーが見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
	});

	test('followingVisibility, followerVisibility がともに followers なユーザーのフォロー/フォロワーをフォロワーが見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followerVisibility: 'followers',
		}, alice);

		await api('/following/create', {
			userId: alice.id,
		}, bob);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	test('followingVisibility が followers なユーザーのフォローを followerVisibility の設定に関わらずフォロワーが見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'public',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'private',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followerVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらずフォロワーが見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'followers',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'followers',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'followers',
			}, alice);
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followerVisibility がともに private なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'private',
			followerVisibility: 'private',
		}, alice);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, alice);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, alice);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	test('followingVisibility が private なユーザーのフォローを followerVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followerVisibility が private なユーザーのフォロワーを followingVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followerVisibility がともに private なユーザーのフォロー/フォロワーを他人が見れない', async () => {
		await api('/i/update', {
			followingVisibility: 'private',
			followerVisibility: 'private',
		}, alice);

		const followingRes = await api('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await api('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 400);
		assert.strictEqual(followersRes.status, 400);
	});

	test('followingVisibility が private なユーザーのフォローを followerVisibility の設定に関わらず他人が見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
	});

	test('followerVisibility が private なユーザーのフォロワーを followingVisibility の設定に関わらず他人が見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followerVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
	});

	describe('AP', () => {
		test('followingVisibility が public 以外ならばAPからはフォローを取得できない', async () => {
			{
				await api('/i/update', {
					followingVisibility: 'public',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 200);
			}
			{
				await api('/i/update', {
					followingVisibility: 'followers',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 403);
			}
			{
				await api('/i/update', {
					followingVisibility: 'private',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 403);
			}
		});

		test('followerVisibility が public 以外ならばAPからはフォロワーを取得できない', async () => {
			{
				await api('/i/update', {
					followerVisibility: 'public',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 200);
			}
			{
				await api('/i/update', {
					followerVisibility: 'followers',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 403);
			}
			{
				await api('/i/update', {
					followerVisibility: 'private',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 403);
			}
		});
	});
});
