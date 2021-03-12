/*
 * Tests for Fetch resource
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/fetch-resource.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/fetch-resource.ts --require ts-node/register -g 'test name'
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, launchServer, signup, post, request, simpleGet } from './utils';

// Request Accept
const ONLY_AP = 'application/activity+json';
const PREFER_AP = 'application/activity+json, */*';
const PREFER_HTML = 'text/html, */*';
const UNSPECIFIED = '*/*';

// Response Contet-Type
const AP = 'application/activity+json; charset=utf-8';
const HTML = 'text/html; charset=utf-8';

describe('Fetch resource', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let alicesPost: any;

	before(launchServer(g => p = g, async () => {
		alice = await signup({ username: 'alice' });
		alicesPost = await post(alice, {
			text: 'test'
		});
	}));

	after(() => {
		p.kill();
	});

	describe('Common', () => {
		it('meta', async(async () => {
			const res = await request('/meta', {
			});

			assert.strictEqual(res.status, 200);
		}));

		it('GET root', async(async () => {
			const res = await simpleGet('/', 'text/html');
			assert.strictEqual(res.status, 200);
		}));

		it('GET docs', async(async () => {
			const res = await simpleGet('/docs/ja-JP/about', 'text/html');
			assert.strictEqual(res.status, 200);
		}));

		it('GET api-doc', async(async () => {
			const res = await simpleGet('/api-doc', 'text/html');
			assert.strictEqual(res.status, 200);
		}));

		it('GET api.json', async(async () => {
			const res = await simpleGet('/api.json', 'application/json');
			assert.strictEqual(res.status, 200);
		}));

		it('GET favicon.ico', async(async () => {
			const res = await simpleGet('/favicon.ico', 'image/png');
			assert.strictEqual(res.status, 200);
		}));
	});

	describe('/@:username', () => {
		it('Only AP => AP', async(async () => {
			const res = await simpleGet(`/@${alice.username}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer AP => AP', async(async () => {
			const res = await simpleGet(`/@${alice.username}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer HTML => HTML', async(async () => {
			const res = await simpleGet(`/@${alice.username}`, PREFER_HTML);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));

		it('Unspecified => HTML', async(async () => {
			const res = await simpleGet(`/@${alice.username}`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));
	});

	describe('/users/:id', () => {
		it('Only AP => AP', async(async () => {
			const res = await simpleGet(`/users/${alice.id}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer AP => AP', async(async () => {
			const res = await simpleGet(`/users/${alice.id}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer HTML => Redirect to /@:username', async(async () => {
			const res = await simpleGet(`/users/${alice.id}`, PREFER_HTML);
			assert.strictEqual(res.status, 302);
			assert.strictEqual(res.location, `/@${alice.username}`);
		}));

		it('Undecided => HTML', async(async () => {
			const res = await simpleGet(`/users/${alice.id}`, UNSPECIFIED);
			assert.strictEqual(res.status, 302);
			assert.strictEqual(res.location, `/@${alice.username}`);
		}));
	});

	describe('/notes/:id', () => {
		it('Only AP => AP', async(async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, ONLY_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer AP => AP', async(async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, PREFER_AP);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, AP);
		}));

		it('Prefer HTML => HTML', async(async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, PREFER_HTML);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));

		it('Unspecified => HTML', async(async () => {
			const res = await simpleGet(`/notes/${alicesPost.id}`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));
	});

	describe('Feeds', () => {
		it('RSS', async(async () => {
			const res = await simpleGet(`/@${alice.username}.rss`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/rss+xml; charset=utf-8');
		}));

		it('ATOM', async(async () => {
			const res = await simpleGet(`/@${alice.username}.atom`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/atom+xml; charset=utf-8');
		}));

		it('JSON', async(async () => {
			const res = await simpleGet(`/@${alice.username}.json`, UNSPECIFIED);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'application/json; charset=utf-8');
		}));
	});
});
