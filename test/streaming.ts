/*
 * Tests of streaming API
 *
 * How to run the tests:
 * > mocha test/streaming.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/streaming.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { connectStream, signup, request, post } from './utils';

describe('Streaming', () => {
	let p: childProcess.ChildProcess;

	beforeEach(done => {
		p = childProcess.spawn('node', [__dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test' }
		});
		p.on('message', message => {
			if (message === 'ok') {
				done();
			}
		});
	});

	afterEach(() => {
		p.kill();
	});

	it('投稿がタイムラインに流れる', () => new Promise(async done => {
		const post = {
			text: 'foo'
		};

		const me = await signup();

		const ws = await connectStream(me, 'homeTimeline', ({ type, body }) => {
			if (type == 'note') {
				assert.deepStrictEqual(body.text, post.text);
				ws.close();
				done();
			}
		});

		request('/notes/create', post, me);
	}));

	it('mention event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });
		const aliceNote = {
			text: 'foo @bob bar'
		};

		const ws = await connectStream(bob, 'main', ({ type, body }) => {
			if (type == 'mention') {
				assert.deepStrictEqual(body.text, aliceNote.text);
				ws.close();
				done();
			}
		});

		request('/notes/create', aliceNote, alice);
	}));

	it('renote event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });
		const bobNote = await post(bob, {
			text: 'foo'
		});

		const ws = await connectStream(bob, 'main', ({ type, body }) => {
			if (type == 'renote') {
				assert.deepStrictEqual(body.renoteId, bobNote.id);
				ws.close();
				done();
			}
		});

		request('/notes/create', {
			renoteId: bobNote.id
		}, alice);
	}));
});
