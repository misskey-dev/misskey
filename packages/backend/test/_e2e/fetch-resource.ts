process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import * as openapi from '@redocly/openapi-core';
import { startServer, signup, post, request, simpleGet, port, shutdownServer } from '../utils.js';

// Request Accept
const ONLY_AP = 'application/activity+json';
const PREFER_AP = 'application/activity+json, */*';
const PREFER_HTML = 'text/html, */*';
const UNSPECIFIED = '*/*';

// Response Content-Type
const AP = 'application/activity+json; charset=utf-8';
const JSON = 'application/json; charset=utf-8';
const HTML = 'text/html; charset=utf-8';

describe('Fetch resource', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let alicesPost: any;

	beforeAll(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		alicesPost = await post(alice, {
			text: 'test',
		});
	}, 1000 * 30);

	afterAll(async () => {
		await shutdownServer(p);
	});

	describe('Common', () => {
		test('meta', async () => {
			const res = await request('/meta', {
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
			assert.strictEqual(res.type, HTML);
		});

		test('GET api.json', async () => {
			const res = await simpleGet('/api.json');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, JSON);
		});

		test('Validate api.json', async () => {
			const config = await openapi.loadConfig();
			const result = await openapi.bundle({
				config,
				ref: `http://localhost:${port}/api.json`,
			});

			for (const problem of result.problems) {
				console.log(`${problem.message} - ${problem.location[0]?.pointer}`);
			}

			assert.strictEqual(result.problems.length, 0);
		});

		test('GET favicon.ico', async () => {
			const res = await simpleGet('/favicon.ico');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/x-icon');
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
