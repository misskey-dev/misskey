process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { signup, request, post, react, connectStream, startServer, shutdownServer, simpleGet } from '../utils.js';

describe('FF visibility', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let bob: any;
	let carol: any;

	beforeAll(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 30);

	afterAll(async () => {
		await shutdownServer(p);
	});

	it('ffVisibility が public なユーザーのフォロー/フォロワーを誰でも見れる', async () => {
		await request('/i/update', {
			ffVisibility: 'public',
		}, alice);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	it('ffVisibility が followers なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await request('/i/update', {
			ffVisibility: 'followers',
		}, alice);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, alice);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, alice);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	it('ffVisibility が followers なユーザーのフォロー/フォロワーを非フォロワーが見れない', async () => {
		await request('/i/update', {
			ffVisibility: 'followers',
		}, alice);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 400);
		assert.strictEqual(followersRes.status, 400);
	});

	it('ffVisibility が followers なユーザーのフォロー/フォロワーをフォロワーが見れる', async () => {
		await request('/i/update', {
			ffVisibility: 'followers',
		}, alice);

		await request('/following/create', {
			userId: alice.id,
		}, bob);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	it('ffVisibility が private なユーザーのフォロー/フォロワーを自分で見れる', async () => {
		await request('/i/update', {
			ffVisibility: 'private',
		}, alice);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, alice);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, alice);

		assert.strictEqual(followingRes.status, 200);
		assert.strictEqual(Array.isArray(followingRes.body), true);
		assert.strictEqual(followersRes.status, 200);
		assert.strictEqual(Array.isArray(followersRes.body), true);
	});

	it('ffVisibility が private なユーザーのフォロー/フォロワーを他人が見れない', async () => {
		await request('/i/update', {
			ffVisibility: 'private',
		}, alice);

		const followingRes = await request('/users/following', {
			userId: alice.id,
		}, bob);
		const followersRes = await request('/users/followers', {
			userId: alice.id,
		}, bob);

		assert.strictEqual(followingRes.status, 400);
		assert.strictEqual(followersRes.status, 400);
	});

	describe('AP', () => {
		it('ffVisibility が public 以外ならばAPからは取得できない', async () => {
			{
				await request('/i/update', {
					ffVisibility: 'public',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
				assert.strictEqual(followingRes.status, 200);
				assert.strictEqual(followersRes.status, 200);
			}
			{
				await request('/i/update', {
					ffVisibility: 'followers',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
				assert.strictEqual(followingRes.status, 403);
				assert.strictEqual(followersRes.status, 403);
			}
			{
				await request('/i/update', {
					ffVisibility: 'private',
				}, alice);

				const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
				const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
				assert.strictEqual(followingRes.status, 403);
				assert.strictEqual(followersRes.status, 403);
			}
		});
	});
});
