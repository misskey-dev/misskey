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

	test('followingVisibility, followersVisibility がともに public なユーザーのフォロー/フォロワーを誰でも見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'public',
			followersVisibility: 'public',
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

	test('followingVisibility が public であれば followersVisibility の設定に関わらずユーザーのフォローを誰でも見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'public',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followersVisibility が public であれば followingVisibility の設定に関わらずユーザーのフォロワーを誰でも見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'public',
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
				followersVisibility: 'public',
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
				followersVisibility: 'public',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followersVisibility がともに followers なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followersVisibility: 'followers',
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

	test('followingVisibility が followers なユーザーのフォローを followersVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'public',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followersVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'followers',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followersVisibility がともに followers なユーザーのフォロー/フォロワーを非フォロワーが見れない', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followersVisibility: 'followers',
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

	test('followingVisibility が followers なユーザーのフォローを followersVisibility の設定に関わらず非フォロワーが見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
	});

	test('followersVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらず非フォロワーが見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
	});

	test('followingVisibility, followersVisibility がともに followers なユーザーのフォロー/フォロワーをフォロワーが見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'followers',
			followersVisibility: 'followers',
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

	test('followingVisibility が followers なユーザーのフォローを followersVisibility の設定に関わらずフォロワーが見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'public',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'private',
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

	test('followersVisibility が followers なユーザーのフォロワーを followingVisibility の設定に関わらずフォロワーが見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'followers',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'followers',
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

	test('followingVisibility, followersVisibility がともに private なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			followingVisibility: 'private',
			followersVisibility: 'private',
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

	test('followingVisibility が private なユーザーのフォローを followersVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'public',
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
				followersVisibility: 'followers',
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
				followersVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		}
	});

	test('followersVisibility が private なユーザーのフォロワーを followingVisibility の設定に関わらず自分で見れる', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'private',
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
				followersVisibility: 'private',
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
				followersVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		}
	});

	test('followingVisibility, followersVisibility がともに private なユーザーのフォロー/フォロワーを他人が見れない', async () => {
		await api('/i/update', {
			followingVisibility: 'private',
			followersVisibility: 'private',
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

	test('followingVisibility が private なユーザーのフォローを followersVisibility の設定に関わらず他人が見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followingRes.status, 400);
		}
	});

	test('followersVisibility が private なユーザーのフォロワーを followingVisibility の設定に関わらず他人が見れない', async () => {
		{
			await api('/i/update', {
				followingVisibility: 'public',
				followersVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'followers',
				followersVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);
			assert.strictEqual(followersRes.status, 400);
		}
		{
			await api('/i/update', {
				followingVisibility: 'private',
				followersVisibility: 'private',
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

		test('followersVisibility が public 以外ならばAPからはフォロワーを取得できない', async () => {
			{
				await api('/i/update', {
					followersVisibility: 'public',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 200);
			}
			{
				await api('/i/update', {
					followersVisibility: 'followers',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 403);
			}
			{
				await api('/i/update', {
					followersVisibility: 'private',
				}, alice);

				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followersRes.status, 403);
			}
		});
	});
});
