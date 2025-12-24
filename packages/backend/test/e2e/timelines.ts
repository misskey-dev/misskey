/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// How to run:
// pnpm jest -- e2e/timelines.ts

import * as assert from 'assert';
import { setTimeout } from 'node:timers/promises';
import { entities } from 'misskey-js';
import { Redis } from 'ioredis';
import { SignupResponse, Note } from 'misskey-js/entities.js';
import { api, initTestDb, post, randomString, sendEnvUpdateRequest, signup, uploadUrl, UserToken } from '../utils.js';
import { loadConfig } from '@/config.js';

function genHost() {
	return randomString() + '.example.com';
}

let redisForTimelines: Redis;
let root: SignupResponse;

async function renote(noteId: string, user: UserToken): Promise<entities.Note> {
	return await api('notes/create', { renoteId: noteId }, user).then(it => it.body.createdNote);
}

async function createChannel(name: string, user: UserToken): Promise<entities.ChannelsCreateResponse> {
	return (await api('channels/create', { name }, user)).body;
}

async function followChannel(channelId: string, user: UserToken) {
	return await api('channels/follow', { channelId }, user);
}

async function muteChannel(channelId: string, user: UserToken) {
	await api('channels/mute/create', { channelId }, user);
}

async function createList(name: string, user: UserToken): Promise<entities.UsersListsCreateResponse> {
	return (await api('users/lists/create', { name }, user)).body;
}

async function pushList(listId: string, pushUserIds: string[] = [], user: UserToken) {
	for (const userId of pushUserIds) {
		await api('users/lists/push', { listId, userId }, user);
	}
	await setTimeout(500);
}

async function createRole(name: string, user: UserToken): Promise<entities.AdminRolesCreateResponse> {
	return (await api('admin/roles/create', {
		name,
		description: '',
		color: '#000000',
		iconUrl: '',
		target: 'manual',
		condFormula: {},
		isPublic: true,
		isModerator: false,
		isAdministrator: false,
		isExplorable: true,
		asBadge: false,
		canEditMembersByModerator: false,
		displayOrder: 0,
		policies: {},
	}, user)).body;
}

async function assignRole(roleId: string, userId: string, user: UserToken) {
	await api('admin/roles/assign', { userId, roleId }, user);
}

describe('Timelines', () => {
	let root: UserToken;

	beforeAll(async () => {
		redisForTimelines = new Redis(loadConfig().redisForTimelines);
		root = await signup({ username: 'root' });
	}, 1000 * 60 * 2);

	// afterEach(async () => {
	// 	// テスト中に作ったノートをきれいにする。
	// 	// ユーザも作っているが、時間差で動く通知系処理などがあり、このタイミングで消すとエラー落ちするので消さない（ノートさえ消えていれば支障はない）
	// 	const db = await initTestDb(true);
	// 	await db.query('DELETE FROM "note"');
	// 	await db.query('DELETE FROM "channel"');
	// });

	describe.each([
		{ enableFanoutTimeline: true },
		{ enableFanoutTimeline: false },
	])('Timelines (enableFanoutTimeline: $enableFanoutTimeline)', ({ enableFanoutTimeline }) => {
		function waitForPushToTl() {
			return setTimeout(250);
		}

		beforeAll(async () => {
			await api('admin/update-meta', { enableFanoutTimeline }, root);
		}, 1000 * 60 * 2);

		describe('Home TL', () => {
			test('自分の visibility: followers なノートが含まれる', async () => {
				const [alice] = await Promise.all([signup()]);

				const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
			});

			test('フォローしているユーザーのノートが含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi' });
				const carolNote = await post(carol, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('フォローしているユーザーの visibility: followers なノートが含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });
				const carolNote = await post(carol, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: false でフォローしているユーザーの他人への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーの他人への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーの他人へのDM返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: carol.id }, bob);
				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/create', { userId: carol.id }, alice);
				await api('following/create', { userId: carol.id }, bob);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === carolNote.id)?.text, 'hi');
			});

			test('withReplies: true でフォローしているユーザーの自分の visibility: followers な投稿への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/create', { userId: alice.id }, bob);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			});

			test('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/create', { userId: carol.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
			});

			test('withReplies: false でフォローしているユーザーのそのユーザー自身への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			});

			test('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('自分の他人への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi' });
				const aliceNote = await post(alice, { text: 'hi', replyId: bobNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			});

			test('フォローしているユーザーの他人の投稿のリノートが含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('[withRenotes: false] フォローしているユーザーの投稿が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi' });
				const carolNote = await post(carol, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/timeline', {
					limit: 100,
					withRenotes: false,
				}, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('[withRenotes: false] フォローしているユーザーのファイルのみの投稿が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const [bobFile, carolFile] = await Promise.all([
					uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
					uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
				]);
				const bobNote = await post(bob, { fileIds: [bobFile.id] });
				const carolNote = await post(carol, { fileIds: [carolFile.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', {
					limit: 100,
					withRenotes: false,
				}, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('[withRenotes: false] フォローしているユーザーの他人の投稿のリノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', {
					withRenotes: false,
				}, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('[withRenotes: false] フォローしているユーザーの他人の投稿の引用が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', {
					withRenotes: false,
				}, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('フォローしているユーザーの他人への visibility: specified なノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによる引用ノートの、フォローしているユーザーによるリノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', renoteId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === daveNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによるリプライの、フォローしているユーザーによるリノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', replyId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === daveNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているリモートユーザーのノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
				await api('following/create', { userId: bob.id }, alice);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
				await api('following/create', { userId: bob.id }, alice);

				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withFiles: true] フォローしているユーザーのファイル付きノートのみ含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const [bobFile, carolFile] = await Promise.all([
					uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
					uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
				]);
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { fileIds: [bobFile.id] });
				const carolNote1 = await post(carol, { text: 'hi' });
				const carolNote2 = await post(carol, { fileIds: [carolFile.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100, withFiles: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote2.id), false);
			}, 1000 * 30);

			test('フォローしているユーザーのチャンネル投稿が含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('自分の visibility: specified なノートが含まれる', async () => {
				const [alice] = await Promise.all([signup()]);

				const aliceNote = await post(alice, { text: 'hi', visibility: 'specified' });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
			});

			test('フォローしているユーザーの自身を visibleUserIds に指定した visibility: specified なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
			});

			test('フォローしていないユーザーの自身を visibleUserIds に指定した visibility: specified なノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているユーザーの自身を visibleUserIds に指定していない visibility: specified なノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしていないユーザーからの visibility: specified なノートに返信したときの自身のノートが含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });
				const aliceNote = await post(alice, { text: 'ok', visibility: 'specified', visibleUserIds: [bob.id], replyId: bobNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'ok');
			});

			/* TODO
			test('自身の visibility: specified なノートへのフォローしていないユーザーからの返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);
				const aliceNote = await post(alice, { text: 'hi', visibility: 'specified', visibleUserIds: [bob.id] });
				const bobNote = await post(bob, { text: 'ok', visibility: 'specified', visibleUserIds: [alice.id], replyId: aliceNote.id });
				await waitForPushToTl();
				const res = await api('notes/timeline', { limit: 100 }, alice);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id).text, 'ok');
			});
			*/

			// ↑の挙動が理想だけど実装が面倒かも
			test('自身の visibility: specified なノートへのフォローしていないユーザーからの返信が含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const aliceNote = await post(alice, { text: 'hi', visibility: 'specified', visibleUserIds: [bob.id] });
				const bobNote = await post(bob, { text: 'ok', visibility: 'specified', visibleUserIds: [alice.id], replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			describe('Channel', () => {
				test('チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				});

				test('チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});
			});

			test('FTT: ローカルユーザーの HTL にはプッシュされる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', {
					userId: alice.id,
				}, bob);

				const aliceNote = await post(alice, { text: 'I\'m Alice.' });
				const bobNote = await post(bob, { text: 'I\'m Bob.' });
				const carolNote = await post(carol, { text: 'I\'m Carol.' });

				await waitForPushToTl();

				if (enableFanoutTimeline) {
					// NOTE: notes/timeline だと DB へのフォールバックが効くので Redis を直接見て確かめる
					assert.strictEqual(await redisForTimelines.exists(`list:homeTimeline:${bob.id}`), 1);

					const bobHTL = await redisForTimelines.lrange(`list:homeTimeline:${bob.id}`, 0, -1);
					assert.strictEqual(bobHTL.includes(aliceNote.id), true);
					assert.strictEqual(bobHTL.includes(bobNote.id), true);
					assert.strictEqual(bobHTL.includes(carolNote.id), false);
				} else {
					assert.strictEqual(await redisForTimelines.exists(`list:homeTimeline:${bob.id}`), 0);
				}
			});

			test('FTT: リモートユーザーの HTL にはプッシュされない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				await api('following/create', {
					userId: alice.id,
				}, bob);

				await post(alice, { text: 'I\'m Alice.' });
				await post(bob, { text: 'I\'m Bob.' });

				await waitForPushToTl();

				// NOTE: notes/timeline だと DB へのフォールバックが効くので Redis を直接見て確かめる
				assert.strictEqual(await redisForTimelines.exists(`list:homeTimeline:${bob.id}`), 0);
			});

			describe('凍結', () => {
				let alice: SignupResponse, bob: SignupResponse, carol: SignupResponse;
				let aliceNote: Note, bobNote: Note, carolNote: Note;

				beforeAll(async () => {
					[alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

					await api('following/create', { userId: bob.id }, alice);
					await api('following/create', { userId: carol.id }, alice);
					aliceNote = await post(alice, { text: 'hi' });
					bobNote = await post(bob, { text: 'yo' });
					carolNote = await post(carol, { text: 'kon\'nichiwa' });

					await waitForPushToTl();

					await api('admin/suspend-user', { userId: carol.id }, root);
					await setTimeout(100);
				});

				test('凍結後に凍結されたユーザーのノートは見えなくなる', async () => {
					const res = await api('notes/timeline', { limit: 100 }, alice);
					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				});

				test('凍結解除後に凍結されていたユーザーのノートは見えるようになる', async () => {
					await api('admin/unsuspend-user', { userId: carol.id }, root);
					await setTimeout(100);

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
					assert.strictEqual(res.body.find(note => note.id === carolNote.id)?.text, 'kon\'nichiwa');
				});
			});

			describe('凍結 (Renote)', () => {
				let alice: SignupResponse, bob: SignupResponse, carol: SignupResponse;
				let aliceNote: Note, bobNote: Note, carolNote: Note, bobRenote: Note, carolRenote: Note;

				beforeAll(async () => {
					[alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

					await api('following/create', { userId: bob.id }, alice);
					await api('following/create', { userId: carol.id }, alice);
					aliceNote = await post(alice, { text: 'hi' });
					bobNote = await post(bob, { text: 'yo' });
					carolNote = await post(carol, { text: 'kon\'nichiwa' });
					bobRenote = await post(bob, { renoteId: carolNote.id });
					carolRenote = await post(carol, { renoteId: bobNote.id });

					await waitForPushToTl();

					await api('admin/suspend-user', { userId: carol.id }, root);
					await setTimeout(100);
				});

				test('凍結後に凍結されたユーザーに対するRenoteや凍結されたユーザーのRenoteが見えなくなる', async () => {
					const res = await api('notes/timeline', { limit: 100 }, alice);
					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
					assert.strictEqual(res.body.some(note => note.id === bobRenote.id), false);
					assert.strictEqual(res.body.some(note => note.id === carolRenote.id), false);
				});

				test('凍結解除後に凍結されていたユーザーに対するRenoteや凍結されたユーザーのRenoteが見えるようになる', async () => {
					await api('admin/unsuspend-user', { userId: carol.id }, root);
					await setTimeout(100);

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobRenote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolRenote.id), true);
				});
			});

			describe('凍結(リモート)', () => {
				let alice: SignupResponse, bob: SignupResponse, carol: SignupResponse;
				let aliceNote: Note, bobNote: Note, carolNote: Note;

				beforeAll(async () => {
					[alice, bob, carol] = await Promise.all([signup(), signup({ host: genHost() }), signup({ host: genHost() })]);

					await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
					await api('following/create', { userId: bob.id }, alice);
					await api('following/create', { userId: carol.id }, alice);
					aliceNote = await post(alice, { text: 'hi' });
					bobNote = await post(bob, { text: 'yo' });
					carolNote = await post(carol, { text: 'kon\'nichiwa' });

					await waitForPushToTl();

					await api('admin/suspend-user', { userId: carol.id }, root);
					await setTimeout(100);
				});

				test('凍結後に凍結されたユーザーのノートは見えなくなる', async () => {
					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				});

				test('凍結解除後に凍結されていたユーザーのノートは見えるようになる', async () => {
					await api('admin/unsuspend-user', { userId: carol.id }, root);
					await setTimeout(100);

					const res = await api('notes/timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
				});
			});
		});

		describe('Local TL', () => {
			test('visibility: home なノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('他人の他人への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
			});

			test('他人のその人自身への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			});

			test('チャンネル投稿が含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('リモートユーザーのノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			// 含まれても良いと思うけど実装が面倒なので含まれない
			test('フォローしているユーザーの visibility: home なノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('ミュートしているユーザーのノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによる引用ノートの、リノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', renoteId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === daveNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによるリプライの、リノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', replyId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === daveNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('withReplies: false でフォローしていないユーザーからの自分への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withReplies: true] 他人の他人への返信が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { fileIds: [file.id] });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100, withFiles: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			}, 1000 * 10);

			describe('Channel', () => {
				test('チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/local-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});
			});
		});

		describe('Social TL', () => {
			test('ローカルユーザーのノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('ローカルユーザーの visibility: home なノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているローカルユーザーの visibility: home なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */
				if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: carol.id }, bob);
				await api('following/create', { userId: bob.id }, alice);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
			});

			test('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */
				if (!enableFanoutTimeline) return;

				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/create', { userId: carol.id }, alice);
				await api('following/create', { userId: carol.id }, bob);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
				assert.strictEqual(res.body.find((note: any) => note.id === carolNote.id)?.text, 'hi');
			});

			test('withReplies: true でフォローしているユーザーの自分の visibility: followers な投稿への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */
				if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('following/create', { userId: alice.id }, bob);
				await api('following/update', { userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			});

			test('他人の他人への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
				assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
			});

			test('リモートユーザーのノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているリモートユーザーのノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
				await api('following/create', { userId: bob.id }, alice);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

				await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
				await api('following/create', { userId: bob.id }, alice);

				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('withReplies: false でフォローしていないユーザーからの自分への返信が含まれる', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */
				if (!enableFanoutTimeline) return;

				const [alice, bob] = await Promise.all([signup(), signup()]);

				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/local-timeline', { limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withReplies: true] 他人の他人への返信が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { fileIds: [file.id] });

				await waitForPushToTl();

				const res = await api('notes/hybrid-timeline', { limit: 100, withFiles: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			}, 1000 * 10);

			describe('Channel', () => {
				test('チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				});

				test('チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザ未フォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　ユーザフォロー　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);
					await api('following/create', { userId: bob.id }, alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});
			});

			describe('凍結', () => {
				/*
				 * bob = 未フォローのローカルユーザー (凍結対象でない)
				 * carol = 未フォローのローカルユーザー (凍結対象)
				 * dave = フォローしているローカルユーザー (凍結対象)
				 */
				let alice: SignupResponse, bob: SignupResponse, carol: SignupResponse, dave: SignupResponse;
				let aliceNote: Note, bobNote: Note, carolNote: Note, daveNote: Note;

				beforeAll(async () => {
					[alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

					await api('following/create', { userId: dave.id }, alice);
					aliceNote = await post(alice, { text: 'hi' });
					bobNote = await post(bob, { text: 'yo' });
					carolNote = await post(carol, { text: 'kon\'nichiwa' });
					daveNote = await post(dave, { text: 'hello' });

					await waitForPushToTl();

					await api('admin/suspend-user', { userId: carol.id }, root);
					await api('admin/suspend-user', { userId: dave.id }, root);
					await setTimeout(250);
				});

				test('凍結後に凍結されたユーザーのノートは見えなくなる', async () => {
					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
					assert.strictEqual(res.body.some(note => note.id === daveNote.id), false);
				});

				test('凍結解除後に凍結されていたユーザーのノートは見えるようになる', async () => {
					await api('admin/unsuspend-user', { userId: carol.id }, root);
					await api('admin/unsuspend-user', { userId: dave.id }, root);
					await setTimeout(250);

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === daveNote.id), true);
				});
			});

			describe('凍結 (リモート)', () => {
				/*
				 * carol = 未フォローのリモートユーザー (凍結対象)
				 * elle = フォローしているリモートユーザー (凍結対象)
				 */
				let alice: SignupResponse, carol: SignupResponse, elle: SignupResponse;
				let aliceNote: Note, carolNote: Note, elleNote: Note;

				beforeAll(async () => {
					[alice, carol, elle] = await Promise.all([signup(), signup({ host: genHost() }), signup({ host: genHost() })]);

					await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
					await api('following/create', { userId: elle.id }, alice);
					aliceNote = await post(alice, { text: 'hi' });
					carolNote = await post(carol, { text: 'kon\'nichiwa' });
					elleNote = await post(elle, { text: 'hi there' });

					await waitForPushToTl();

					await api('admin/suspend-user', { userId: carol.id }, root);
					await api('admin/suspend-user', { userId: elle.id }, root);
					await setTimeout(250);
				});

				test('凍結後に凍結されたユーザーのノートは見えなくなる', async () => {
					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
					assert.strictEqual(res.body.some(note => note.id === elleNote.id), false);
				});

				test('凍結解除後に凍結されていたユーザーのノートは見えるようになる', async () => {
					await api('admin/unsuspend-user', { userId: carol.id }, root);
					await api('admin/unsuspend-user', { userId: elle.id }, root);
					await setTimeout(250);

					const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

					assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
					assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
					assert.strictEqual(res.body.some(note => note.id === elleNote.id), true);
				});
			});
		});

		describe('User List TL', () => {
			test('リスインしているフォローしていないユーザーのノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('リスインしているフォローしていないユーザーの visibility: home なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('リスインしているフォローしていないユーザーの visibility: followers なノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('リスインしているフォローしていないユーザーの他人への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('リスインしているフォローしていないユーザーのユーザー自身への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			});

			test('withReplies: false でリスインしているフォローしていないユーザーからの自分への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: false }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('withReplies: false でリスインしているフォローしていないユーザーの他人への返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: false }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('withReplies: true でリスインしているフォローしていないユーザーの他人への返信が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: true }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('リスインしているフォローしているユーザーの visibility: home なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('リスインしているフォローしているユーザーの visibility: followers なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
			});

			test('リスインしている自分の visibility: followers なノートが含まれる', async () => {
				const [alice] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: alice.id }, alice);
				await setTimeout(250);
				const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
			});

			test('リスインしているユーザーのチャンネルノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('[withFiles: true] リスインしているユーザーのファイル付きノートのみ含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { fileIds: [file.id] });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id, withFiles: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			}, 1000 * 10);

			test('リスインしているユーザーの自身宛ての visibility: specified なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
			});

			test('リスインしているユーザーの自身宛てではない visibility: specified なノートが含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
				await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
				await api('users/lists/push', { listId: list.id, userId: carol.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

				await waitForPushToTl();

				const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			describe('Channel', () => {
				test('チャンネル未フォロー　＋　リスインしてない　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　リスインしてない　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　リスインしてる　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　リスインしてる　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　リスインしてない　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　リスインしてない　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネル未フォロー　＋　リスインしてる　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('チャンネルフォロー　＋　リスインしてる　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　リスインしてない　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　リスインしてない　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　リスインしてる　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　リスインしてる　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　リスインしてない　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　リスインしてない　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネル未フォロー　＋　リスインしてる　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});

				test('[チャンネル外リノート] チャンネルフォロー　＋　リスインしてる　＋　チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const list = await createList('list', alice);
					await pushList(list.id, [bob.id], alice);

					const channel = await createChannel('channel', bob);
					await followChannel(channel.id, alice);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('notes/user-list-timeline', { limit: 100, listId: list.id }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});
			});
		});

		describe('User TL', () => {
			test('ノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('フォローしていないユーザーの visibility: followers なノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('フォローしているユーザーの visibility: followers なノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
			});

			test('自身の visibility: followers なノートが含まれる', async () => {
				const [alice] = await Promise.all([signup()]);

				const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: alice.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
				assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
			});

			test('チャンネル投稿が含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('[withReplies: false] 他人への返信が含まれない', async () => {
				/* FIXME: https://github.com/misskey-dev/misskey/issues/12065 */ if (!enableFanoutTimeline) return;

				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), false);
			});

			test('[withReplies: true] 他人への返信が含まれる', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			});

			test('[withReplies: true] 他人への visibility: specified な返信が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				const carolNote = await post(carol, { text: 'hi' });
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), false);
			});

			test('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { fileIds: [file.id] });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withFiles: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			}, 1000 * 10);

			test('[withChannelNotes: true] チャンネル投稿が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('[withChannelNotes: true] 他人が取得した場合センシティブチャンネル投稿が含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await api('channels/create', { name: 'channel', isSensitive: true }, bob).then(x => x.body);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('[withChannelNotes: true] 自分が取得した場合センシティブチャンネル投稿が含まれる', async () => {
				const [bob] = await Promise.all([signup()]);

				const channel = await api('channels/create', { name: 'channel', isSensitive: true }, bob).then(x => x.body);
				const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, bob);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			});

			test('ミュートしているユーザーに関連する投稿が含まれない', async () => {
				const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによる引用ノートの、リノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', renoteId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('ミュートしているユーザーのノートの、関係のないユーザによるリプライの、リノートが含まれない', async () => {
				const [alice, bob, carol, dave] = await Promise.all([signup(), signup(), signup(), signup()]);

				await api('following/create', { userId: bob.id }, alice);
				await api('mute/create', { userId: carol.id }, alice);
				await setTimeout(250);
				const carolNote = await post(carol, { text: 'hi' });
				const daveNote = await post(dave, { text: 'quote hi', replyId: carolNote.id });
				const bobNote = await post(bob, { renoteId: daveNote.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, limit: 100 }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			test('ミュートしていても userId に指定したユーザーの投稿が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('mute/create', { userId: bob.id }, alice);
				await setTimeout(250);
				const bobNote1 = await post(bob, { text: 'hi' });
				const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });
				const bobNote3 = await post(bob, { text: 'hi', renoteId: bobNote1.id });
				const bobNote4 = await post(bob, { renoteId: bobNote2.id });
				const bobNote5 = await post(bob, { renoteId: bobNote3.id });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote3.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote4.id), true);
				assert.strictEqual(res.body.some(note => note.id === bobNote5.id), true);
			});

			test('自身の visibility: specified なノートが含まれる', async () => {
				const [alice] = await Promise.all([signup()]);

				const aliceNote = await post(alice, { text: 'hi', visibility: 'specified' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: alice.id, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			});

			test('visibleUserIds に指定されてない visibility: specified なノートが含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const bobNote = await post(bob, { text: 'hi', visibility: 'specified' });

				await waitForPushToTl();

				const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

				assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			});

			/** @see https://github.com/misskey-dev/misskey/issues/14000 */
			test('FTT: sinceId にキャッシュより古いノートを指定しても、sinceId による絞り込みが正しく動作する', async () => {
				const alice = await signup();
				const noteSince = await post(alice, { text: 'Note where id will be `sinceId`.' });
				const note1 = await post(alice, { text: '1' });
				const note2 = await post(alice, { text: '2' });
				await redisForTimelines.del('list:userTimeline:' + alice.id);
				const note3 = await post(alice, { text: '3' });

				const res = await api('users/notes', { userId: alice.id, sinceId: noteSince.id });
				assert.deepStrictEqual(res.body, [note1, note2, note3]);
			});

			test('FTT: sinceId にキャッシュより古いノートを指定しても、sinceId と untilId による絞り込みが正しく動作する', async () => {
				const alice = await signup();
				const noteSince = await post(alice, { text: 'Note where id will be `sinceId`.' });
				const note1 = await post(alice, { text: '1' });
				const note2 = await post(alice, { text: '2' });
				await redisForTimelines.del('list:userTimeline:' + alice.id);
				const note3 = await post(alice, { text: '3' });
				const noteUntil = await post(alice, { text: 'Note where id will be `untilId`.' });
				await post(alice, { text: '4' });

				const res = await api('users/notes', { userId: alice.id, sinceId: noteSince.id, untilId: noteUntil.id });
				assert.deepStrictEqual(res.body, [note3, note2, note1]);
			});

			describe('Channel', () => {
				test('チャンネルミュートなし　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
				});

				test('チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

					await waitForPushToTl();

					const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
				});

				test('[チャンネル外リノート] チャンネルミュートなし　＝　TLに流れる', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
				});

				test('[チャンネル外リノート] チャンネルミュート　＝　TLに流れない', async () => {
					const [alice, bob] = await Promise.all([signup(), signup()]);

					const channel = await createChannel('channel', bob);
					await muteChannel(channel.id, alice);

					const aliceNote = await post(alice, { text: 'hi' });
					const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
					const bobRenote = await renote(bobNote.id, bob);

					await waitForPushToTl();

					const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

					assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
				});
			});
		});

		describe('Channel TL', () => {
			test('閲覧中チャンネルのノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			});

			test('閲覧中チャンネルとは別チャンネルのノートは含まれない', async() => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				const channel2 = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel2.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			});

			test('閲覧中チャンネルのノートにリノートが含まれる', async() => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
				const bobRenote = await post(bob, { channelId: channel.id, renoteId: bobNote.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
			});

			test('閲覧中チャンネルとは別チャンネルからのリノートが含まれる', async() => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				const channel2 = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel2.id });
				const bobRenote = await post(bob, { channelId: channel.id, renoteId: bobNote.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
			});

			test('閲覧中チャンネルに自分の他人への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);

				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
				const aliceNote = await post(alice, { text: 'hi', replyId: bobNote.id, channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			});

			test('閲覧中チャンネルに他人の自分への返信が含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi', channelId: channel.id });
				const bobNote = await post(bob, { text: 'ok', replyId: aliceNote.id, channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			});

			test('閲覧中チャンネルにミュートしているユーザのノートは含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('mute/create', { userId: bob.id }, alice);

				const channel = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			});

			test('閲覧中チャンネルにこちらをブロックしているユーザのノートは含まれない', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				await api('blocking/create', { userId: alice.id }, bob);

				const channel = await createChannel('channel', bob);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			});

			test('閲覧中チャンネルをミュートしていてもノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				await muteChannel(channel.id, alice);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
				assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			});

			test('閲覧中チャンネルをミュートしていても、同チャンネルのリノートが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				await muteChannel(channel.id, alice);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
				const bobRenote = await post(bob, { channelId: channel.id, renoteId: bobNote.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
			});

			test('閲覧中チャンネルをミュートしていても、同チャンネルのリプライが含まれる', async () => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				await muteChannel(channel.id, alice);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel.id });
				const bobRenote = await post(bob, { channelId: channel.id, replyId: bobNote.id, text: 'ho' });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), true);
			});

			test('閲覧中チャンネルとは別チャンネルをミュートしているとき、そのチャンネルからのリノートは含まれない', async() => {
				const [alice, bob] = await Promise.all([signup(), signup()]);

				const channel = await createChannel('channel', bob);
				const channel2 = await createChannel('channel', bob);
				await muteChannel(channel2.id, alice);

				const aliceNote = await post(alice, { text: 'hi' });
				const bobNote = await post(bob, { text: 'ok', channelId: channel2.id });
				const bobRenote = await post(bob, { channelId: channel.id, renoteId: bobNote.id });

				await waitForPushToTl();

				const res = await api('channels/timeline', { channelId: channel.id }, alice);

				assert.strictEqual(res.body.some((note: any) => note.id === bobRenote.id), false);
			});
		});
		// TODO: リノートミュート済みユーザーのテスト
		// TODO: ページネーションのテスト
	});
});
