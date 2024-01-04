/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { host, origin, relativeFetch, signup, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('.well-known', () => {
	let app: INestApplicationContext;
	let alice: misskey.entities.User;

	beforeAll(async () => {
		app = await startServer();

		alice = await signup({ username: 'alice' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('nodeinfo', async () => {
		const res = await relativeFetch('.well-known/nodeinfo');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');

		const nodeInfo = await res.json();
		assert.deepStrictEqual(nodeInfo, {
			links: [{
				rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
				href: `${origin}/nodeinfo/2.1`,
			}, {
				rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
				href: `${origin}/nodeinfo/2.0`,
			}],
		});
	});

	test('webfinger', async () => {
		const preflight = await relativeFetch(`.well-known/webfinger?resource=acct:alice@${host}`, {
			method: 'options',
			headers: {
				'Access-Control-Request-Method': 'GET',
				Origin: 'http://example.com',
			},
		});
		assert.ok(preflight.ok);
		assert.strictEqual(preflight.headers.get('Access-Control-Allow-Headers'), 'Accept');

		const res = await relativeFetch(`.well-known/webfinger?resource=acct:alice@${host}`);
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
		assert.strictEqual(res.headers.get('Access-Control-Expose-Headers'), 'Vary');
		assert.strictEqual(res.headers.get('Vary'), 'Accept');

		const webfinger = await res.json();

		assert.deepStrictEqual(webfinger, {
			subject: `acct:alice@${host}`,
			links: [{
				rel: 'self',
				type: 'application/activity+json',
				href: `${origin}/users/${alice.id}`,
			}, {
				rel: 'http://webfinger.net/rel/profile-page',
				type: 'text/html',
				href: `${origin}/@alice`,
			}, {
				rel: 'http://ostatus.org/schema/1.0/subscribe',
				template: `${origin}/authorize-follow?acct={uri}`,
			}],
		});
	});

	test('host-meta', async () => {
		const res = await relativeFetch('.well-known/host-meta');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
	});

	test('host-meta.json', async () => {
		const res = await relativeFetch('.well-known/host-meta.json');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');

		const hostMeta = await res.json();
		assert.deepStrictEqual(hostMeta, {
			links: [{
				rel: 'lrdd',
				type: 'application/jrd+json',
				template: `${origin}/.well-known/webfinger?resource={uri}`,
			}],
		});
	});

	test('oauth-authorization-server', async () => {
		const res = await relativeFetch('.well-known/oauth-authorization-server');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');

		const serverInfo = await res.json() as any;
		assert.strictEqual(serverInfo.issuer, origin);
		assert.strictEqual(serverInfo.authorization_endpoint, `${origin}/oauth/authorize`);
		assert.strictEqual(serverInfo.token_endpoint, `${origin}/oauth/token`);
	});
});
