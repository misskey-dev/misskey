/*
 * Tests of streaming API
 *
 * How to run the tests:
 * > mocha test/streaming.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/streaming.ts --require ts-node/register -g 'test name'
 */

import * as http from 'http';
import * as WebSocket from 'ws';
import * as assert from 'assert';
import { _signup, _request, _uploadFile, _post, _react, resetDb } from './utils';

//#region process
Error.stackTraceLimit = Infinity;

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);
//#endregion

const app = require('../built/server/api').default;
const server = require('../built/server').startServer();
const db = require('../built/db/mongodb').default;

const apiServer = http.createServer(app.callback());

//#region Utilities
const request = _request(apiServer);
const signup = _signup(request);
const post = _post(request);
//#endregion

describe('Streaming', () => {
	// Reset database each test
	beforeEach(resetDb(db));

	after(() => {
		server.close();
	});

	it('投稿がタイムラインに流れる', () => new Promise(async done => {
		const post = {
			text: 'foo'
		};

		const me = await signup();
		const ws = new WebSocket(`ws://localhost/streaming?i=${me.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type == 'channel' && msg.body.id == 'a') {
					if (msg.body.type == 'note') {
						assert.deepStrictEqual(msg.body.body.text, post.text);
						ws.close();
						done();
					}
				} else if (msg.type == 'connected' && msg.body.id == 'a') {
					request('/notes/create', post, me);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: 'homeTimeline',
					id: 'a',
					pong: true
				}
			}));
		});
	}));

	it('mention event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });
		const aliceNote = {
			text: 'foo @bob bar'
		};

		const ws = new WebSocket(`ws://localhost/streaming?i=${bob.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type == 'channel' && msg.body.id == 'a') {
					if (msg.body.type == 'mention') {
						assert.deepStrictEqual(msg.body.body.text, aliceNote.text);
						ws.close();
						done();
					}
				} else if (msg.type == 'connected' && msg.body.id == 'a') {
					request('/notes/create', aliceNote, alice);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: 'main',
					id: 'a',
					pong: true
				}
			}));
		});
	}));

	it('renote event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });
		const bobNote = await post(bob, {
			text: 'foo'
		});

		const ws = new WebSocket(`ws://localhost/streaming?i=${bob.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type == 'channel' && msg.body.id == 'a') {
					if (msg.body.type == 'renote') {
						assert.deepStrictEqual(msg.body.body.renoteId, bobNote.id);
						ws.close();
						done();
					}
				} else if (msg.type == 'connected' && msg.body.id == 'a') {
					request('/notes/create', {
						renoteId: bobNote.id
					}, alice);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: 'main',
					id: 'a',
					pong: true
				}
			}));
		});
	}));
});
