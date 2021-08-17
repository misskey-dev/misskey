/*
 * Tests of block
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/block.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/block.ts --require ts-node/register -g 'test name'
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, startServer, shutdownServer } from './utils';

describe('Block', () => {
	let p: childProcess.ChildProcess;

	// alice blocks bob
	let alice: any;
	let bob: any;
	let carol: any;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	});

	after(async () => {
		await shutdownServer(p);
	});

	it('Block作成', async(async () => {
		const res = await request('/blocking/create', {
			userId: bob.id
		}, alice);

		assert.strictEqual(res.status, 200);
	}));

	it('ブロックされているユーザーをフォローできない', async(async () => {
		const res = await request('/following/create', { userId: alice.id }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.id, 'c4ab57cc-4e41-45e9-bfd9-584f61e35ce0');
	}));

	it('ブロックされているユーザーにリアクションできない', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/reactions/create', { noteId: note.id, reaction: '👍' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.id, '20ef5475-9f38-4e4c-bd33-de6d979498ec');
	}));

	it('ブロックされているユーザーに返信できない', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/create', { replyId: note.id, text: 'yo' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.id, 'b390d7e1-8a5e-46ed-b625-06271cafd3d3');
	}));

	it('ブロックされているユーザーのノートをRenoteできない', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/create', { renoteId: note.id, text: 'yo' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.id, 'b390d7e1-8a5e-46ed-b625-06271cafd3d3');
	}));

	// TODO: ユーザーリストに入れられないテスト

	// TODO: ユーザーリストから除外されるテスト

	it('タイムライン(LTL)にブロックされているユーザーの投稿が含まれない', async(async () => {
		const aliceNote = await post(alice);
		const bobNote = await post(bob);
		const carolNote = await post(carol);

		const res = await request('/notes/local-timeline', {}, bob);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
	}));
});
