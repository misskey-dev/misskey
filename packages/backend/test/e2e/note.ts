/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { Note } from '@/models/entities/Note.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { signup, post, uploadUrl, startServer, initTestDb, api, uploadFile } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('Note', () => {
	let app: INestApplicationContext;
	let Notes: any;

	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;

	beforeAll(async () => {
		app = await startServer();
		const connection = await initTestDb(true);
		Notes = connection.getRepository(Note);
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('投稿できる', async () => {
		const post = {
			text: 'test',
		};

		const res = await api('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	});

	test('ファイルを添付できる', async () => {
		const file = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

		const res = await api('/notes/create', {
			fileIds: [file.id],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.deepStrictEqual(res.body.createdNote.fileIds, [file.id]);
	}, 1000 * 10);

	test('他人のファイルで怒られる', async () => {
		const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

		const res = await api('/notes/create', {
			text: 'test',
			fileIds: [file.id],
		}, alice);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
		assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
	}, 1000 * 10);

	test('存在しないファイルで怒られる', async () => {
		const res = await api('/notes/create', {
			text: 'test',
			fileIds: ['000000000000000000000000'],
		}, alice);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
		assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
	});

	test('不正なファイルIDで怒られる', async () => {
		const res = await api('/notes/create', {
			fileIds: ['kyoppie'],
		}, alice);
		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
		assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
	});

	test('返信できる', async () => {
		const bobPost = await post(bob, {
			text: 'foo',
		});

		const alicePost = {
			text: 'bar',
			replyId: bobPost.id,
		};

		const res = await api('/notes/create', alicePost, alice);

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

		const res = await api('/notes/create', alicePost, alice);

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

		const res = await api('/notes/create', alicePost, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, alicePost.text);
		assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
		assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
	});

	test('visibility: followersでrenoteできる', async () => {
		const createRes = await api('/notes/create', {
			text: 'test',
			visibility: 'followers',
		}, alice);

		assert.strictEqual(createRes.status, 200);

		const renoteId = createRes.body.createdNote.id;
		const renoteRes = await api('/notes/create', {
			visibility: 'followers',
			renoteId,
		}, alice);

		assert.strictEqual(renoteRes.status, 200);
		assert.strictEqual(renoteRes.body.createdNote.renoteId, renoteId);
		assert.strictEqual(renoteRes.body.createdNote.visibility, 'followers');

		const deleteRes = await api('/notes/delete', {
			noteId: renoteRes.body.createdNote.id,
		}, alice);

		assert.strictEqual(deleteRes.status, 204);
	});

	test('文字数ぎりぎりで怒られない', async () => {
		const post = {
			text: '!'.repeat(MAX_NOTE_TEXT_LENGTH), // 3000文字
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 200);
	});

	test('文字数オーバーで怒られる', async () => {
		const post = {
			text: '!'.repeat(MAX_NOTE_TEXT_LENGTH + 1), // 3001文字
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないリプライ先で怒られる', async () => {
		const post = {
			text: 'test',
			replyId: '000000000000000000000000',
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないrenote対象で怒られる', async () => {
		const post = {
			renoteId: '000000000000000000000000',
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('不正なリプライ先IDで怒られる', async () => {
		const post = {
			text: 'test',
			replyId: 'foo',
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('不正なrenote対象IDで怒られる', async () => {
		const post = {
			renoteId: 'foo',
		};
		const res = await api('/notes/create', post, alice);
		assert.strictEqual(res.status, 400);
	});

	test('存在しないユーザーにメンションできる', async () => {
		const post = {
			text: '@ghost yo',
		};

		const res = await api('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);
	});

	test('同じユーザーに複数メンションしても内部的にまとめられる', async () => {
		const post = {
			text: '@bob @bob @bob yo',
		};

		const res = await api('/notes/create', post, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
		assert.strictEqual(res.body.createdNote.text, post.text);

		const noteDoc = await Notes.findOneBy({ id: res.body.createdNote.id });
		assert.deepStrictEqual(noteDoc.mentions, [bob.id]);
	});

	describe('添付ファイル情報', () => {
		test('ファイルを添付した場合、投稿成功時にファイル情報入りのレスポンスが帰ってくる', async () => {
			const file = await uploadFile(alice);
			const res = await api('/notes/create', {
				fileIds: [file.body.id],
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.files.length, 1);
			assert.strictEqual(res.body.createdNote.files[0].id, file.body.id);
		});

		test('ファイルを添付した場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
			const file = await uploadFile(alice);
			const createdNote = await api('/notes/create', {
				fileIds: [file.body.id],
			}, alice);

			assert.strictEqual(createdNote.status, 200);

			const res = await api('/notes', {
				withFiles: true,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			const myNote = res.body.find((note: { id: string; files: { id: string }[] }) => note.id === createdNote.body.createdNote.id);
			assert.notEqual(myNote, null);
			assert.strictEqual(myNote.files.length, 1);
			assert.strictEqual(myNote.files[0].id, file.body.id);
		});

		test('ファイルが添付されたノートをリノートした場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
			const file = await uploadFile(alice);
			const createdNote = await api('/notes/create', {
				fileIds: [file.body.id],
			}, alice);

			assert.strictEqual(createdNote.status, 200);

			const renoted = await api('/notes/create', {
				renoteId: createdNote.body.createdNote.id,
			}, alice);
			assert.strictEqual(renoted.status, 200);

			const res = await api('/notes', {
				renote: true,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			const myNote = res.body.find((note: { id: string }) => note.id === renoted.body.createdNote.id);
			assert.notEqual(myNote, null);
			assert.strictEqual(myNote.renote.files.length, 1);
			assert.strictEqual(myNote.renote.files[0].id, file.body.id);
		});

		test('ファイルが添付されたノートに返信した場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
			const file = await uploadFile(alice);
			const createdNote = await api('/notes/create', {
				fileIds: [file.body.id],
			}, alice);

			assert.strictEqual(createdNote.status, 200);

			const reply = await api('/notes/create', {
				replyId: createdNote.body.createdNote.id,
				text: 'this is reply',
			}, alice);
			assert.strictEqual(reply.status, 200);

			const res = await api('/notes', {
				reply: true,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			const myNote = res.body.find((note: { id: string }) => note.id === reply.body.createdNote.id);
			assert.notEqual(myNote, null);
			assert.strictEqual(myNote.reply.files.length, 1);
			assert.strictEqual(myNote.reply.files[0].id, file.body.id);
		});

		test('ファイルが添付されたノートへの返信をリノートした場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
			const file = await uploadFile(alice);
			const createdNote = await api('/notes/create', {
				fileIds: [file.body.id],
			}, alice);

			assert.strictEqual(createdNote.status, 200);

			const reply = await api('/notes/create', {
				replyId: createdNote.body.createdNote.id,
				text: 'this is reply',
			}, alice);
			assert.strictEqual(reply.status, 200);

			const renoted = await api('/notes/create', {
				renoteId: reply.body.createdNote.id,
			}, alice);
			assert.strictEqual(renoted.status, 200);

			const res = await api('/notes', {
				renote: true,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			const myNote = res.body.find((note: { id: string }) => note.id === renoted.body.createdNote.id);
			assert.notEqual(myNote, null);
			assert.strictEqual(myNote.renote.reply.files.length, 1);
			assert.strictEqual(myNote.renote.reply.files[0].id, file.body.id);
		});

		test('NSFWが強制されている場合変更できない', async () => {
			const file = await uploadFile(alice);

			const res = await api('admin/roles/create', {
				name: 'test',
				description: '',
				color: null,
				iconUrl: null,
				displayOrder: 0,
				target: 'manual',
				condFormula: {},
				isAdministrator: false,
				isModerator: false,
				isPublic: false,
				isExplorable: false,
				asBadge: false,
				canEditMembersByModerator: false,
				policies: {
					alwaysMarkNsfw: {
						useDefault: false,
						priority: 0,
						value: true,
					},
				},
			}, alice);

			assert.strictEqual(res.status, 200);

			const assign = await api('admin/roles/assign', {
				userId: alice.id,
				roleId: res.body.id,
			}, alice);

			assert.strictEqual(assign.status, 204);
			assert.strictEqual(file.body.isSensitive, false);

			const nsfwfile = await uploadFile(alice);

			assert.strictEqual(nsfwfile.status, 200);
			assert.strictEqual(nsfwfile.body.isSensitive, true);

			const liftnsfw = await api('drive/files/update', {
				fileId: nsfwfile.body.id,
				isSensitive: false,
			}, alice);

			assert.strictEqual(liftnsfw.status, 400);
			assert.strictEqual(liftnsfw.body.error.code, 'RESTRICTED_BY_ROLE');

			const oldaddnsfw = await api('drive/files/update', {
				fileId: file.body.id,
				isSensitive: true,
			}, alice);

			assert.strictEqual(oldaddnsfw.status, 200);

			await api('admin/roles/unassign', {
				userId: alice.id,
				roleId: res.body.id,
			});

			await api('admin/roles/delete', {
				roleId: res.body.id,
			}, alice);
		});
	});

	describe('notes/create', () => {
		test('投票を添付できる', async () => {
			const res = await api('/notes/create', {
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
			const res = await api('/notes/create', {
				poll: {},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票の選択肢が無くて怒られる (空の配列)', async () => {
			const res = await api('/notes/create', {
				poll: {
					choices: [],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票の選択肢が1つで怒られる', async () => {
			const res = await api('/notes/create', {
				poll: {
					choices: ['Strawberry Pasta'],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('投票できる', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('複数投票できない', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('許可されている場合は複数投票できる', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					multiple: true,
				},
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('締め切られている場合は投票できない', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					expiredAfter: 1,
				},
			}, alice);

			await new Promise(x => setTimeout(x, 2));

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('センシティブな投稿はhomeになる (単語指定)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'test',
				],
			}, alice);

			assert.strictEqual(sensitive.status, 204);

			await new Promise(x => setTimeout(x, 2));

			const note1 = await api('/notes/create', {
				text: 'hogetesthuge',
			}, alice);

			assert.strictEqual(note1.status, 200);
			assert.strictEqual(note1.body.createdNote.visibility, 'home');
		});

		test('センシティブな投稿はhomeになる (正規表現)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'/Test/i',
				],
			}, alice);

			assert.strictEqual(sensitive.status, 204);

			const note2 = await api('/notes/create', {
				text: 'hogetesthuge',
			}, alice);

			assert.strictEqual(note2.status, 200);
			assert.strictEqual(note2.body.createdNote.visibility, 'home');
		});

		test('センシティブな投稿はhomeになる (スペースアンド)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'Test hoge',
				],
			}, alice);

			assert.strictEqual(sensitive.status, 204);

			const note2 = await api('/notes/create', {
				text: 'hogeTesthuge',
			}, alice);

			assert.strictEqual(note2.status, 200);
			assert.strictEqual(note2.body.createdNote.visibility, 'home');
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
