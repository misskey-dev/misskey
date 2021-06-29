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
import { async, startServer, signup, post, request, simpleGet, port, shutdownServer } from './utils';
import * as openapi from '@redocly/openapi-core';

// Request Accept
const ONLY_AP = 'application/activity+json';
const PREFER_AP = 'application/activity+json, */*';
const PREFER_HTML = 'text/html, */*';
const UNSPECIFIED = '*/*';

// Response Contet-Type
const AP = 'application/activity+json; charset=utf-8';
const JSON = 'application/json; charset=utf-8';
const HTML = 'text/html; charset=utf-8';

describe('Fetch resource', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let alicesPost: any;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		alicesPost = await post(alice, {
			text: 'test'
		});
	});

	after(async () => {
		await shutdownServer(p);
	});

	describe('Common', () => {
		it('meta', async(async () => {
			const res = await request('/meta', {
			});

			assert.strictEqual(res.status, 200);
		}));

		it('GET root', async(async () => {
			const res = await simpleGet('/');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));

		it('GET docs', async(async () => {
			const res = await simpleGet('/docs/ja-JP/about');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));

		it('GET api-doc', async(async () => {
			const res = await simpleGet('/api-doc');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, HTML);
		}));

		it('GET api.json', async(async () => {
			const res = await simpleGet('/api.json');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, JSON);
		}));

		it('Validate api.json', async(async () => {
			const config = await openapi.loadConfig();
			const result = await openapi.bundle({
				config,
				ref: `http://localhost:${port}/api.json`
			});

			for (const problem of result.problems) {
				console.log(`${problem.message} - ${problem.location[0]?.pointer}`);
			}

			assert.strictEqual(result.problems.length, 0);
		}));

		it('GET favicon.ico', async(async () => {
			const res = await simpleGet('/favicon.ico');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/x-icon');
		}));

		it('GET apple-touch-icon.png', async(async () => {
			const res = await simpleGet('/apple-touch-icon.png');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.type, 'image/png');
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
