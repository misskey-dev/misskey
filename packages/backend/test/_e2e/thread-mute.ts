process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { signup, request, post, react, connectStream, startServer, shutdownServer } from '../utils.js';

describe('Note thread mute', () => {
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

	it('notes/mentions にミュートしているスレッドの投稿が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

		await request('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
		const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });

		const res = await request('/notes/mentions', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolReply.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolReplyWithoutMention.id), false);
	});

	it('ミュートしているスレッドからメンションされても、hasUnreadMentions が true にならない', async () => {
		// 状態リセット
		await request('/i/read-all-unread-notes', {}, alice);

		const bobNote = await post(bob, { text: '@alice @carol root note' });

		await request('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });

		const res = await request('/i', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.hasUnreadMentions, false);
	});

	it('ミュートしているスレッドからメンションされても、ストリームに unreadMention イベントが流れてこない', () => new Promise(async done => {
		// 状態リセット
		await request('/i/read-all-unread-notes', {}, alice);

		const bobNote = await post(bob, { text: '@alice @carol root note' });

		await request('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

		let fired = false;

		const ws = await connectStream(alice, 'main', async ({ type, body }) => {
			if (type === 'unreadMention') {
				if (body === bobNote.id) return;
				fired = true;
			}
		});

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });

		setTimeout(() => {
			assert.strictEqual(fired, false);
			ws.close();
			done();
		}, 5000);
	}));

	it('i/notifications にミュートしているスレッドの通知が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

		await request('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
		const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });

		const res = await request('/i/notifications', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((notification: any) => notification.note.id === carolReply.id), false);
		assert.strictEqual(res.body.some((notification: any) => notification.note.id === carolReplyWithoutMention.id), false);

		// NOTE: bobの投稿はスレッドミュート前に行われたため通知に含まれていてもよい
	});
});
