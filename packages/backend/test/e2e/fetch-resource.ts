process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { startServer, signup, post, api, simpleGet } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

// Request Accept
const ONLY_AP = 'application/activity+json';
const PREFER_AP = 'application/activity+json, */*';
const PREFER_HTML = 'text/html, */*';
const UNSPECIFIED = '*/*';

// Response Content-Type
const AP = 'application/activity+json; charset=utf-8';
const HTML = 'text/html; charset=utf-8';
const JSON_UTF8 = 'application/json; charset=utf-8';

describe('Fetch resource', () => {
	let p: INestApplicationContext;

	let alice: any;
	let alicesPost: any;

	beforeAll(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		alicesPost = await post(alice, {
			text: 'test',
		});
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await p.close();
	});

	describe('Common', () => {
		test('meta', async () => {
			const res = await api('/meta', {
			});

			assert.strictEqual(res.status, 200);
		});

		test('GET root', async () => {
			const res = await simpleGet('/');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});

		test('GET docs', async () => {
			const res = await simpleGet('/docs/ja-JP/about');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});

		test('GET api-doc', async () => {
			const res = await simpleGet('/api-doc');
			assert.strictEqual(res.status, 200);
			// fastify-static gives charset=UTF-8 instead of utf-8 and that's okay
			assert.strictEqual(res.type?.toLowerCase(), HTML);
		});

		test('GET api.json', async () => {
			const res = await simpleGet('/api.json');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, JSON_UTF8);
		});

		test('GET api/foo (存在しない)', async () => {
			const res = await simpleGet('/api/foo');
			assert.strictEqual(res.status, 404);
			assert.strictEqual(res.body.error.code, 'UNKNOWN_API_ENDPOINT');
		});

		test('GET api-console (client page)', async () => {
			const res = await simpleGet('/api-console');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});

		test('GET favicon.ico', async () => {
			const res = await simpleGet('/favicon.ico');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/vnd.microsoft.icon');
		});

		test('GET apple-touch-icon.png', async () => {
			const res = await simpleGet('/apple-touch-icon.png');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/png');
		});

		test('GET twemoji svg', async () => {
			const res = await simpleGet('/twemoji/2764.svg');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/svg+xml');
		});

		test('GET twemoji svg with hyphen', async () => {
			const res = await simpleGet('/twemoji/2764-fe0f-200d-1f525.svg');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/svg+xml');
		});
	});

	describe('/@:username', () => {
		test('Only AP => AP', async () => {
			const res = await simpleGet(`/@${alice.username}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer AP => AP', async () => {
			const res = await simpleGet(`/@${alice.username}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer HTML => HTML', async () => {
			const res = await simpleGet(`/@${alice.username}`, PREFER_HTML);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});

		test('Unspecified => HTML', async () => {
			const res = await simpleGet(`/@${alice.username}`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});
	});

	describe('/users/:id', () => {
		test('Only AP => AP', async () => {
			const res = await simpleGet(`/users/${alice.id}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer AP => AP', async () => {
			const res = await simpleGet(`/users/${alice.id}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer HTML => Redirect to /@:username', async () => {
			const res = await simpleGet(`/users/${alice.id}`, PREFER_HTML);
			assert.strictEqual(res.status, 302);
			assert.strictEqual(res.location, `/@${alice.username}`);
		});

		test('Undecided => HTML', async () => {
			const res = await simpleGet(`/users/${alice.id}`, UNSPECIFIED);
			assert.strictEqual(res.status, 302);
			assert.strictEqual(res.location, `/@${alice.username}`);
		});
	});

	describe('/notes/:id', () => {
		test('Only AP => AP', async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer AP => AP', async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		});

		test('Prefer HTML => HTML', async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, PREFER_HTML);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});

		test('Unspecified => HTML', async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		});
	});

	describe('Feeds', () => {
		test('RSS', async () => {
			const res = await simpleGet(`/@${alice.username}.rss`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/rss+xml; charset=utf-8');
		});

		test('ATOM', async () => {
			const res = await simpleGet(`/@${alice.username}.atom`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/atom+xml; charset=utf-8');
		});

		test('JSON', async () => {
			const res = await simpleGet(`/@${alice.username}.json`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/json; charset=utf-8');
		});
	});
});
