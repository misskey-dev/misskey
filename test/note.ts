/*
 * Tests of Note
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/note.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/note.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, uploadFile, launchServer } from './utils';
import { Note } from '../src/models/entities/note';
import { initDb } from '../src/db/postgre';

describe('Note', () => {
	let p: childProcess.ChildProcess;
	let Notes: any;

	let alice: any;
	let bob: any;

	before(launchServer(g => p = g, async () => {
		const connection = await initDb(true);
		Notes = connection.getRepository(Note);
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}));

	after(() => {
		p.kill();
	});

	it('投稿できる', async(async () => {
		const post = {
			text: 'test'
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	}));

	it('ファイルを添付できる', async(async () => {
		const file = await uploadFile(alice);

		const res = await request('/notes/create', {
			fileIds: [file.id]
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, [file.id]);
	}));

	it('他人のファイルは無視', async(async () => {
		const file = await uploadFile(bob);

		const res = await request('/notes/create', {
			text: 'test',
			fileIds: [file.id]
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, []);
	}));

	it('存在しないファイルは無視', async(async () => {
		const res = await request('/notes/create', {
			text: 'test',
			fileIds: ['000000000000000000000000']
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, []);
	}));

	it('不正なファイルIDで怒られる', async(async () => {
		const res = await request('/notes/create', {
			fileIds: ['kyoppie']
		}, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('返信できる', async(async () => {
		const bobPost = await post(bob, {
			text: 'foo'
		});

		const alicePost = {
			text: 'bar',
			replyId: bobPost.id
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, alicePost.text);
		assert.strictEqual(res.body.createdNote.replyId, alicePost.replyId);
		assert.strictEqual(res.body.createdNote.reply.text, bobPost.text);
	}));

	it('renoteできる', async(async () => {
		const bobPost = await post(bob, {
			text: 'test'
		});

		const alicePost = {
			renoteId: bobPost.id
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
		assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
	}));

	it('引用renoteできる', async(async () => {
		const bobPost = await post(bob, {
			text: 'test'
		});

		const alicePost = {
			text: 'test',
			renoteId: bobPost.id
		};

		const res = await request('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, alicePost.text);
		assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
		assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
	}));

	it('文字数ぎりぎりで怒られない', async(async () => {
		const post = {
			text: '!'.repeat(500)
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 200);
	}));

	it('文字数オーバーで怒られる', async(async () => {
		const post = {
			text: '!'.repeat(501)
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('存在しないリプライ先で怒られる', async(async () => {
		const post = {
			text: 'test',
			replyId: '000000000000000000000000'
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('存在しないrenote対象で怒られる', async(async () => {
		const post = {
			renoteId: '000000000000000000000000'
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('不正なリプライ先IDで怒られる', async(async () => {
		const post = {
			text: 'test',
			replyId: 'foo'
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('不正なrenote対象IDで怒られる', async(async () => {
		const post = {
			renoteId: 'foo'
		};
		const res = await request('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	}));

	it('存在しないユーザーにメンションできる', async(async () => {
		const post = {
			text: '@ghost yo'
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	}));

	it('同じユーザーに複数メンションしても内部的にまとめられる', async(async () => {
		const post = {
			text: '@bob @bob @bob yo'
		};

		const res = await request('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);

		const noteDoc = await Notes.findOne(res.body.createdNote.id);
		assert.deepStrictEqual(noteDoc.mentions, [bob.id]);
	}));

	describe('notes/create', () => {
		it('投票を添付できる', async(async () => {
			const res = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['foo', 'bar']
				}
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.poll != null, true);
		}));

		it('投票の選択肢が無くて怒られる', async(async () => {
			const res = await request('/notes/create', {
				poll: {}
			}, alice);
			assert.strictEqual(res.status, 400);
		}));

		it('投票の選択肢が無くて怒られる (空の配列)', async(async () => {
			const res = await request('/notes/create', {
				poll: {
					choices: []
				}
			}, alice);
			assert.strictEqual(res.status, 400);
		}));

		it('投票の選択肢が1つで怒られる', async(async () => {
			const res = await request('/notes/create', {
				poll: {
					choices: ['Strawberry Pasta']
				}
			}, alice);
			assert.strictEqual(res.status, 400);
		}));

		it('投票できる', async(async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako']
				}
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1
			}, alice);

			assert.strictEqual(res.status, 204);
		}));

		it('複数投票できない', async(async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako']
				}
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('許可されている場合は複数投票できる', async(async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					multiple: true
				}
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0
			}, alice);

			await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1
			}, alice);

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2
			}, alice);

			assert.strictEqual(res.status, 204);
		}));

		it('締め切られている場合は投票できない', async(async () => {
			const { body } = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					expiredAfter: 1
				}
			}, alice);

			await new Promise(x => setTimeout(x, 2));

			const res = await request('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1
			}, alice);

			assert.strictEqual(res.status, 400);
		}));
	});
});
