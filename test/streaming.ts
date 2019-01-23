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
import * as assert from 'chai';
import { _signup, _request, _uploadFile, _post, _react, resetDb } from './utils';

assert.use(require('chai-http'));
const expect = assert.expect;

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
//#endregion

describe('Streaming', () => {
	// Reset database each test
	beforeEach(resetDb(db));

	after(() => {
		server.close();
	});

	it('投稿がタイムラインに流れる', done => {
		const post = {
			text: 'foo'
		};

		signup().then(me => {
			const ws = new WebSocket(`ws://localhost/streaming?i=${me.token}`);

			ws.on('open', () => {
				ws.on('message', data => {
					const msg = JSON.parse(data.toString());
					if (msg.type == 'channel' && msg.body.id == 'a') {
						if (msg.body.type == 'note') {
							expect(msg.body.body.text).eql(post.text);
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
		});
	});
});
