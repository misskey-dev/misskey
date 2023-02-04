process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { Note } from '../../src/models/entities/note.js';
import { async, signup, request, post, uploadUrl, startServer, shutdownServer, initTestDb, api } from '../utils.js';

describe('Note', () => {
	let p: childProcess.ChildProcess;
	let Notes: any;

	let alice: any;
	let bob: any;

	beforeAll(async () => {
		p = await startServer();
		const connection = await initTestDb(true);
		Notes = connection.getRepository(Note);
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 30);

	afterAll(async () => {
		await shutdownServer(p);
	});

	test('投稿できる', async () => {
		const post = {
			text: 'test',
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	});

	test('ファイルを添付できる', async () => {
		const file = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

		const res = await request('/notes/create', {
			fileIds: [file.id],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, [file.id]);
	}, 1000 * 10);

	test('他人のファイルは無視', async () => {
		const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

		const res = await request('/notes/create', {
			text: 'test',
			fileIds: [file.id],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, []);
	}, 1000 * 10);

	test('存在しないファイルは無視', async () => {
		const res = await request('/notes/create', {
			text: 'test',
			fileIds: ['000000000000000000000000'],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, []);
	});

	test('不正なファイルIDは無視', async () => {
		const res = await request('/notes/create', {
			fileIds: ['kyoppie'],
		}, alice);
		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, []);
	});

	test('返信できる', async () => {
		const bobPost = await post(bob, {
			text: 'foo',
		});

		const alicePost = {
			text: 'bar',
			replyId: bobPost.id,
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, alicePost.text);
		assert.strictEqual(res.body.createdNote.replyId, alicePost.replyId);
		assert.strictEqual(res.body.createdNote.reply.text, bobPost.text);
	});

	test('renoteできる', async () => {
		const bobPost = await post(bob, {
			text: 'test',
		});

		const alicePost = {
			renoteId: bobPost.id,
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
		assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
	});

	test('引用renoteできる', async () => {
		const bobPost = await post(bob, {
			text: 'test',
		});

		const alicePost = {
			text: 'test',
			renoteId: bobPost.id,
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, alicePost.text);
		assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
		assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
	});

	test('文字数ぎりぎりで怒られない', async () => {
		const post = {
			text: '!'.repeat(3000),
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 200);
	});

	test('文字数オーバーで怒られる', async () => {
		const post = {
			text: '!'.repeat(3001),
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないリプライ先で怒られる', async () => {
		const post = {
			text: 'test',
			replyId: '000000000000000000000000',
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないrenote対象で怒られる', async () => {
		const post = {
			renoteId: '000000000000000000000000',
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('不正なリプライ先IDで怒られる', async () => {
		const post = {
			text: 'test',
			replyId: 'foo',
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('不正なrenote対象IDで怒られる', async () => {
		const post = {
			renoteId: 'foo',
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないユーザーにメンションできる', async () => {
		const post = {
			text: '@ghost yo',
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	});

	test('同じユーザーに複数メンションしても内部的にまとめられる', async () => {
		const post = {
			text: '@bob @bob @bob yo',
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);

		const noteDoc = await Notes.findOneBy({ id: res.body.createdNote.id });
		assert.deepStrictEqual(noteDoc.mentions, [bob.id]);
	});

	describe('notes/create', () => {
		test('投票を添付できる', async () => {
			const res = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['foo', 'bar'],
				},
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.poll != null, true);
		});

		test('投票の選択肢が無くて怒られる', async () => {
			const res = await request('/notes/create', {
				poll: {},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票の選択肢が無くて怒られる (空の配列)', async () => {
			const res = await request('/notes/create', {
				poll: {
					choices: [],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票の選択肢が1つで怒られる', async () => {
			const res = await request('/notes/create', {
				poll: {
					choices: ['Strawberry Pasta'],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票できる', async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('複数投票できない', async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('許可されている場合は複数投票できる', async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					multiple: true,
				},
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('締め切られている場合は投票できない', async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					expiredAfter: 1,
				},
			}, alice);

			await new Promise(x => setTimeout(x, 2));

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 400);
		});
	});

	describe('notes/delete', () => {
		test('delete a reply', async () => {
			const mainNoteRes = await api('notes/create', {
				text: 'main post',
			}, alice);
			const replyOneRes = await api('notes/create', {
				text: 'reply one',
				replyId: mainNoteRes.body.createdNote.id,
			}, alice);
			const replyTwoRes = await api('notes/create', {
				text: 'reply two',
				replyId: mainNoteRes.body.createdNote.id,
			}, alice);

			const deleteOneRes = await api('notes/delete', {
				noteId: replyOneRes.body.createdNote.id,
			}, alice);

			assert.strictEqual(deleteOneRes.status, 204);
			let mainNote = await Notes.findOneBy({ id: mainNoteRes.body.createdNote.id });
			assert.strictEqual(mainNote.repliesCount, 1);

			const deleteTwoRes = await api('notes/delete', {
				noteId: replyTwoRes.body.createdNote.id,
			}, alice);

			assert.strictEqual(deleteTwoRes.status, 204);
			mainNote = await Notes.findOneBy({ id: mainNoteRes.body.createdNote.id });
			assert.strictEqual(mainNote.repliesCount, 0);
		});
	});
});
