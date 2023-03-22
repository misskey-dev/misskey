process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, startServer, simpleGet } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('FF visibility', () => {
	let app: INestApplicationContext;

	let alice: any;
	let bob: any;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('ffVisibility が public なユーザーのフォロー/フォロワーを誰でも見れる', async () => {
		await api('/i/update', {
			ffVisibility: 'public',
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

	test('ffVisibility が followers なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			ffVisibility: 'followers',
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

	test('ffVisibility が followers なユーザーのフォロー/フォロワーを非フォロワーが見れない', async () => {
		await api('/i/update', {
			ffVisibility: 'followers',
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

	test('ffVisibility が followers なユーザーのフォロー/フォロワーをフォロワーが見れる', async () => {
		await api('/i/update', {
			ffVisibility: 'followers',
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

	test('ffVisibility が private なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await api('/i/update', {
			ffVisibility: 'private',
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

	test('ffVisibility が private なユーザーのフォロー/フォロワーを他人が見れない', async () => {
		await api('/i/update', {
			ffVisibility: 'private',
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

	describe('AP', () => {
		test('ffVisibility が public 以外ならばAPからは取得できない', async () => {
			{
				await api('/i/update', {
					ffVisibility: 'public',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 200);
				assert.strictEqual(followersRes.status, 200);
			}
			{
				await api('/i/update', {
					ffVisibility: 'followers',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 403);
				assert.strictEqual(followersRes.status, 403);
			}
			{
				await api('/i/update', {
					ffVisibility: 'private',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 403);
				assert.strictEqual(followersRes.status, 403);
			}
		});
	});
});
