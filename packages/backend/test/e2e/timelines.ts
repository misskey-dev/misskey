/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// How to run:
// pnpm jest -- e2e/timelines.ts

process.env.NODE_ENV = 'test';
process.env.FORCE_FOLLOW_REMOTE_USER_FOR_TESTING = 'true';

import * as assert from 'assert';
import { inspect } from 'node:util';
import { signup, api, post, react, startServer, waitFire, sleep, uploadUrl, randomString, successfulApiCall, channel } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

function genHost() {
	return randomString() + '.example.com';
}

function waitForPushToTl() {
	// redisのMONITORをうまく使えば無駄な待ち時間を短縮できるかもしれない
	return sleep(500);
}

let app: INestApplicationContext;

beforeAll(async () => {
	app = await startServer();
}, 1000 * 60 * 2);

afterAll(async () => {
	await app.close();
});

const noteText = 'hi.';
const createNoteFor = {
	'自分のノート': async ({ alice }) => {
		return await post(alice, { text: noteText });
	},
	'自分の visibility: home なノート': async ({ alice }) => {
		return await post(alice, { text: noteText, visibility: 'home' });
	},
	'自分の visibility: followers なノート': async ({ alice }) => {
		return await post(alice, { text: noteText, visibility: 'followers' });
	},
	'自分の自分自身宛ての visibility: specified なノート': async ({ alice }) => {
		return await post(alice, { text: noteText, visibility: 'specified', visibleUserIds: [alice.id] });
	},
	'自分の他人宛ての visibility: specified なノート': async ({ alice, carol }) => {
		return await post(alice, { text: noteText, visibility: 'specified', visibleUserIds: [carol.id] });
	},
	'自分の自分自身への返信': async ({ alice }) => {
		const aliceNote = await post(alice, { text: noteText });
		return await post(alice, { text: noteText, replyId: aliceNote.id });
	},
	'自分の他人への返信': async ({ alice, bob }) => {
		const bobNote = await post(bob, { text: noteText });
		return await post(alice, { text: noteText, replyId: bobNote.id });
	},
	'自分のチャンネル投稿': async ({ alice, bob }) => {
		const channel = await api('/channels/create', { name: 'channel' }, bob).then(x => x.body);
		return await post(alice, { text: noteText, channelId: channel.id });
	},
	'自分のフォロー中のチャンネル投稿': async ({ alice, bob }) => {
		const channel = await api('/channels/create', { name: 'channel' }, bob).then(x => x.body);
		await api('channels/follow', { channelId: channel.id }, alice);
		return await post(alice, { text: noteText, channelId: channel.id });
	},
	'自分のフォロー中のセンシティブ設定のチャンネル投稿': async ({ alice, bob }) => {
		const ch = await channel(bob, { isSensitive: true });
		await api('channels/follow', { channelId: ch.id }, alice);
		return await post(alice, { text: noteText, channelId: ch.id });
	},
	'他人のノート': async ({ carol }) => {
		return await post(carol, { text: noteText });
	},
	'他人のファイル付きノート': async ({ carol }) => {
		const carolFile = await uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png') as misskey.entities.DriveFile;
		return await post(carol, { fileIds: [carolFile.id] });
	},
	'他人の visibility: home なノート': async ({ carol }) => {
		return await post(carol, { text: noteText, visibility: 'home' });
	},
	'他人の visibility: followers なノート': async ({ carol }) => {
		return await post(carol, { text: noteText, visibility: 'followers' });
	},
	'他人の他人自身宛ての visibility: specified なノート': async ({ bob }) => {
		return await post(bob, { text: noteText, visibility: 'specified', visibleUserIds: [bob.id] });
	},
	'他人の別の他人宛ての visibility: specified なノート': async ({ carol }) => {
		const [user] = await Promise.all([signup()]);
		return await post(carol, { text: noteText, visibility: 'specified', visibleUserIds: [user.id] });
	},
	'他人の自分への返信': async ({ alice, carol }) => {
		const aliceNote = await post(alice, { text: noteText });
		return await post(carol, { text: noteText, replyId: aliceNote.id });
	},
	'他人の他人自身への返信': async ({ carol }) => {
		const carolNote = await post(carol, { text: noteText });
		return await post(carol, { text: noteText, replyId: carolNote.id });
	},
	'他人の別の他人への返信': async ({ carol }) => {
		const [user] = await Promise.all([signup()]);
		const carolNote = await post(carol, { text: noteText });
		return await post(user, { text: noteText, replyId: carolNote.id });
	},
	'他人の自分の visibility: specified なノートへの返信': async ({ alice, bob }) => {
		const aliceNote = await post(alice, { text: noteText, visibility: 'specified', visibleUserIds: [bob.id] });
		return await post(bob, { text: noteText, visibility: 'specified', visibleUserIds: [alice.id], replyId: aliceNote.id });
	},
	'他人のリモートユーザーのノート': async ({ remote }) => {
		return await post(remote, { text: noteText });
	},
	'他人のチャンネル投稿': async ({ bob }) => {
		const channel = await api('/channels/create', { name: 'channel' }, bob).then(x => x.body);
		return await post(bob, { text: noteText, channelId: channel.id });
	},
	'他人のフォロー中のチャンネル投稿': async ({ alice, bob }) => {
		const channel = await api('/channels/create', { name: 'channel' }, bob).then(x => x.body);
		await api('channels/follow', { channelId: channel.id }, alice);
		return await post(bob, { text: noteText, channelId: channel.id });
	},
	'他人のフォロー中のセンシティブ設定のチャンネル投稿': async ({ alice, bob }) => {
		const ch = await channel(bob, { isSensitive: true });
		await api('channels/follow', { channelId: ch.id }, alice);
		return await post(bob, { text: noteText, channelId: ch.id });
	},
	'フォローしているユーザーのノート': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText });
	},
	'フォローしているユーザーのファイル付きノート': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const bobFile = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png') as misskey.entities.DriveFile;
		return await post(bob, { fileIds: [bobFile.id] });
	},
	'フォローしているユーザーの visibility: home なノート': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText, visibility: 'home' });
	},
	'フォローしているユーザーの visibility: followers なノート': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText, visibility: 'followers' });
	},
	'フォローしているユーザーの自分への返信': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const aliceNote = await post(alice, { text: noteText });
		return await post(bob, { text: noteText, replyId: aliceNote.id });
	},
	'フォローしているユーザーの他人への返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { text: noteText, replyId: carolNote.id });
	},
	'フォローしているユーザーの他人への visibility: specified なノート': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, {
			text: noteText,
			visibility: 'specified',
			visibleUserIds: [carol.id] });
	},
	'フォローしているユーザーのそのユーザー自身への返信': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const bobNote1 = await post(bob, { text: noteText });
		return await post(bob, { text: noteText, replyId: bobNote1.id });
	},
	'フォローしているリモートユーザーのノート': async ({ alice, remote }) => {
		await api('/following/create', { userId: remote.id }, alice);
		await sleep(1000);
		return await post(remote, { text: noteText });
	},
	'フォローしているリモートユーザーの visibility: home なノート': async ({ alice, remote }) => {
		await api('/following/create', { userId: remote.id }, alice);
		await sleep(1000);
		return await post(remote, { text: noteText, visibility: 'home' });
	},
	'withReplies: true でフォローしているユーザーの他人への返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { text: noteText, replyId: carolNote.id });
	},
	'withReplies: true でフォローしているユーザーの他人へのDM返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, {
			text: noteText,
			replyId: carolNote.id,
			visibility: 'specified',
			visibleUserIds: [carolNote.id] });
	},
	'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText, visibility: 'followers' });
		return await post(bob, { text: noteText, replyId: carolNote.id });
	},
	'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/create', { userId: carol.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText, visibility: 'followers' });
		return await post(bob, { text: noteText, replyId: carolNote.id });
	},
	'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/create', { userId: carol.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, {
			text: noteText,
			replyId: carolNote.id,
			visibility: 'specified',
			visibleUserIds: [carolNote.id] });
	},
	'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/following/update', { userId: bob.id, withReplies: true }, alice);
		await api('/mute/create', { userId: carol.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { text: noteText, replyId: carolNote.id });
	},
	'フォローしているユーザーの他人の投稿のリノート': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { renoteId: carolNote.id });
	},
	'フォローしているユーザーの他人のファイル付き投稿のリノート': async ({ alice, bob, carol }) => {
		const carolFile = await uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png') as misskey.entities.DriveFile;
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText, fileIds: [carolFile.id] });
		return await post(bob, { renoteId: carolNote.id });
	},
	'フォローしているユーザーが行ったミュートしているユーザーのリノート': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/mute/create', { userId: carol.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { renoteId: carolNote.id });
	},
	'フォローしているユーザーの他人の投稿の引用': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { text: noteText, renoteId: carolNote.id });
	},
	'フォローしているユーザーが行ったミュートしているユーザーの引用': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/mute/create', { userId: carol.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { text: noteText, renoteId: carolNote.id });
	},
	'フォローしているユーザーのチャンネル投稿': async ({ alice, bob }) => {
		const ch = await channel(bob);
		await api('/following/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText, channelId: ch.id });
	},
	'フォローしているユーザーのフォロー中のチャンネル投稿': async ({ alice, bob }) => {
		const ch = await channel(bob);
		await api('/following/create', { userId: bob.id }, alice);
		await api('channels/follow', { channelId: ch.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText, channelId: ch.id });
	},
	'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': async ({ alice, bob }) => {
		const ch = await channel(bob, { isSensitive: true });
		await api('/following/create', { userId: bob.id }, alice);
		await api('channels/follow', { channelId: ch.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText, channelId: ch.id });
	},
	'フォローしているかつミュートしているユーザーのノート': async ({ alice, bob }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('/mute/create', { userId: bob.id }, alice);
		await sleep(1000);
		return await post(bob, { text: noteText });
	},
	'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': async ({ alice, bob, carol }) => {
		await api('/following/create', { userId: bob.id }, alice);
		await api('renote-mute/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText });
		return await post(bob, { renoteId: carolNote.id });
	},
	'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': async ({ alice, bob, carol }) => {
		const carolFile = await uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png') as misskey.entities.DriveFile;
		await api('/following/create', { userId: bob.id }, alice);
		await api('renote-mute/create', { userId: bob.id }, alice);
		await sleep(1000);
		const carolNote = await post(carol, { text: noteText, fileIds: [carolFile.id] });
		return await post(bob, { renoteId: carolNote.id });
	},
	'ミュートしているユーザーのノート': async ({ alice, carol }) => {
		await api('/mute/create', { userId: carol.id }, alice);
		await sleep(1000);
		return await post(carol, { text: noteText });
	},
	'ブロックしているユーザーのノート': async ({ alice, carol }) => {
		await api('/blocking/create', { userId: carol.id }, alice);
		await sleep(1000);
		return await post(carol, { text: noteText });
	},
	'ブロックしてきているユーザーのノート': async ({ alice, carol }) => {
		await api('/blocking/create', { userId: alice.id }, carol);
		await sleep(1000);
		return await post(carol, { text: noteText });
	},
} as const satisfies Record<string, (users: {
	alice: any,
	bob: any,
	carol: any,
	remote: any,
}) => Promise<misskey.entities.Note>>;

function tableToEntries<T extends object>(table: T) {
	return Object.entries(table) as [keyof T, IncludeOrNotNotation][];
}

type IncludeOrNotNotation = 'は含まれる' | 'は含まれない';
function includeOrNot(value: IncludeOrNotNotation) {
	return value === 'は含まれる';
}

describe('Timelines', () => {
	describe('Home TL', () => {
		const eachTableDefault = {
			'自分のノート': 'は含まれる',
			'自分の visibility: home なノート': 'は含まれる',
			'自分の visibility: followers なノート': 'は含まれる',
			'自分の自分自身宛ての visibility: specified なノート': 'は含まれない', // BUG? 一つ下が含まれるのに？
			'自分の他人宛ての visibility: specified なノート': 'は含まれる',
			'自分の自分自身への返信': 'は含まれる',
			'自分の他人への返信': 'は含まれる',
			'自分のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のチャンネル投稿': 'は含まれる',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'他人のノート': 'は含まれない',
			'他人のファイル付きノート': 'は含まれない',
			'他人の visibility: home なノート': 'は含まれない',
			'他人の visibility: followers なノート': 'は含まれない',
			'他人の他人自身宛ての visibility: specified なノート': 'は含まれない',
			'他人の別の他人宛ての visibility: specified なノート': 'は含まれない',
			'他人の自分への返信': 'は含まれない',
			'他人の他人自身への返信': 'は含まれない',
			'他人の別の他人への返信': 'は含まれない',
			'他人の自分の visibility: specified なノートへの返信': 'は含まれない', // 含まれるのが理想だけど実装が面倒かも
			'他人のリモートユーザーのノート': 'は含まれない',
			'他人のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のチャンネル投稿': 'は含まれる',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのノート': 'は含まれる',
			'フォローしているユーザーのファイル付きノート': 'は含まれる',
			'フォローしているユーザーの visibility: home なノート': 'は含まれる',
			'フォローしているユーザーの visibility: followers なノート': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる', // 1f0c27e フォローしているユーザーからの自分の投稿への返信がタイムラインに含まれない問題を修正
			'フォローしているユーザーの他人への返信': 'は含まれない',
			'フォローしているユーザーの他人への visibility: specified なノート': 'は含まれない',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'フォローしているリモートユーザーのノート': 'は含まれる',
			'フォローしているリモートユーザーの visibility: home なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人へのDM返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': 'は含まれない',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる', // #12027
			'フォローしているユーザーが行ったミュートしているユーザーのリノート': 'は含まれない',
			'フォローしているユーザーの他人の投稿の引用': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーの引用': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'フォローしているかつミュートしているユーザーのノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
			'ミュートしているユーザーのノート': 'は含まれない',
			'ブロックしているユーザーのノート': 'は含まれない',
			'ブロックしてきているユーザーのノート': 'は含まれない',
		} as const satisfies Record<keyof typeof createNoteFor, IncludeOrNotNotation>;
		test.concurrent.each(tableToEntries(eachTableDefault))('[パラメタ指定なし] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/timeline',
				parameters: {},
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
		} as const))('[withRenotes: false] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/timeline',
				parameters: { withRenotes: false },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent('[withFiles: true] フォローしているユーザーのファイル付きノートのみ含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await sleep(1000);
			const [bobFile, carolFile] = await Promise.all([
				uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png'),
				uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png'),
			]);
			const bobNote1 = await post(bob, { text: noteText });
			const bobNote2 = await post(bob, { fileIds: [bobFile.id] });
			const carolNote1 = await post(carol, { text: 'hi' });
			const carolNote2 = await post(carol, { fileIds: [carolFile.id] });

			await waitForPushToTl();

			const res = await api('/notes/timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote2.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote1.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote2.id), false);
		}, 1000 * 10);
	});

	describe('Local TL', () => {
		const eachTableDefault = {
			'自分のノート': 'は含まれる',
			'自分の visibility: home なノート': 'は含まれない',
			'自分の visibility: followers なノート': 'は含まれない',
			'自分の自分自身宛ての visibility: specified なノート': 'は含まれない',
			'自分の他人宛ての visibility: specified なノート': 'は含まれない',
			'自分の自分自身への返信': 'は含まれる',
			'自分の他人への返信': 'は含まれる',
			'自分のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'他人のノート': 'は含まれる',
			'他人のファイル付きノート': 'は含まれる',
			'他人の visibility: home なノート': 'は含まれない',
			'他人の visibility: followers なノート': 'は含まれない',
			'他人の他人自身宛ての visibility: specified なノート': 'は含まれない',
			'他人の別の他人宛ての visibility: specified なノート': 'は含まれない',
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれない',
			'他人の別の他人への返信': 'は含まれない',
			'他人の自分の visibility: specified なノートへの返信': 'は含まれない',
			'他人のリモートユーザーのノート': 'は含まれない',
			'他人のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのノート': 'は含まれる',
			'フォローしているユーザーのファイル付きノート': 'は含まれる',
			'フォローしているユーザーの visibility: home なノート': 'は含まれない', // 含まれても良いと思うけど実装が面倒なので含まれない
			'フォローしているユーザーの visibility: followers なノート': 'は含まれない',
			'フォローしているユーザーの自分への返信': 'は含まれる', // a26d9ea LTLでフォローしているユーザーからの自分への返信が含まれるように
			'フォローしているユーザーの他人への返信': 'は含まれない',
			'フォローしているユーザーの他人への visibility: specified なノート': 'は含まれない',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれない',
			'フォローしているリモートユーザーのノート': 'は含まれない',
			'フォローしているリモートユーザーの visibility: home なノート': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人へのDM返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': 'は含まれない',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーのリノート': 'は含まれない',
			'フォローしているユーザーの他人の投稿の引用': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーの引用': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているかつミュートしているユーザーのノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
			'ミュートしているユーザーのノート': 'は含まれない',
			'ブロックしているユーザーのノート': 'は含まれる', // #12012
			'ブロックしてきているユーザーのノート': 'は含まれない',
		} as const satisfies Record<keyof typeof createNoteFor, IncludeOrNotNotation>;
		test.concurrent.each(tableToEntries(eachTableDefault))('[パラメタ指定なし] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/local-timeline',
				parameters: { limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
		}))('[withRenotes: false] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/local-timeline',
				parameters: { withRenotes: false, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			...eachTableDefault,
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれる',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
		}))('[withReplies: true] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/local-timeline',
				parameters: { withReplies: true, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('/notes/local-timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote2.id), true);
		}, 1000 * 10);
	});

	describe('Social TL', () => {
		const eachTableDefault = {
			'自分のノート': 'は含まれる',
			'自分の visibility: home なノート': 'は含まれる',
			'自分の visibility: followers なノート': 'は含まれる',
			'自分の自分自身宛ての visibility: specified なノート': 'は含まれない', // BUG? 一つ下が含まれるのに？
			'自分の他人宛ての visibility: specified なノート': 'は含まれる',
			'自分の自分自身への返信': 'は含まれる',
			'自分の他人への返信': 'は含まれる',
			'自分のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のチャンネル投稿': 'は含まれる',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'他人のノート': 'は含まれる',
			'他人のファイル付きノート': 'は含まれる',
			'他人の visibility: home なノート': 'は含まれない',
			'他人の visibility: followers なノート': 'は含まれない',
			'他人の他人自身宛ての visibility: specified なノート': 'は含まれない',
			'他人の別の他人宛ての visibility: specified なノート': 'は含まれない',
			'他人の自分への返信': 'は含まれない',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれない',
			'他人の自分の visibility: specified なノートへの返信': 'は含まれない',
			'他人のリモートユーザーのノート': 'は含まれない',
			'他人のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のチャンネル投稿': 'は含まれる',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのノート': 'は含まれる',
			'フォローしているユーザーのファイル付きノート': 'は含まれる',
			'フォローしているユーザーの visibility: home なノート': 'は含まれる',
			'フォローしているユーザーの visibility: followers なノート': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれない',
			'フォローしているユーザーの他人への visibility: specified なノート': 'は含まれない',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'フォローしているリモートユーザーのノート': 'は含まれる',
			'フォローしているリモートユーザーの visibility: home なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人へのDM返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーのリノート': 'は含まれない',
			'フォローしているユーザーの他人の投稿の引用': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーの引用': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'フォローしているかつミュートしているユーザーのノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
			'ミュートしているユーザーのノート': 'は含まれない',
			'ブロックしているユーザーのノート': 'は含まれる', // #12012
			'ブロックしてきているユーザーのノート': 'は含まれない',
		} as const satisfies Record<keyof typeof createNoteFor, IncludeOrNotNotation>;
		test.concurrent.each(tableToEntries(eachTableDefault))('[パラメタ指定なし] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/hybrid-timeline',
				parameters: { limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
		}))('[withRenotes: false] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/hybrid-timeline',
				parameters: { withRenotes: false, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			...eachTableDefault,
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれる',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
		}))('[withReplies: false] %#. %s%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/hybrid-timeline',
				parameters: { withReplies: true, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('/notes/hybrid-timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote2.id), true);
		}, 1000 * 10);
	});

	describe('User List TL', () => {
		async function listedUsers() {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);

			const list = await api('/users/lists/create', { name: 'list' }, alice).then(res => res.body);
			// aliceはリストの作成主、かつ自分をリスインしている
			await api('/users/lists/push', { listId: list.id, userId: alice.id }, alice);
			// bobはフォローしている、かつリスインしている
			await api('/users/lists/push', { listId: list.id, userId: bob.id }, alice);
			// carolはフォローしていないが、リスインはしている
			await api('/users/lists/push', { listId: list.id, userId: carol.id }, alice);
			// remoteはリモートかつフォローしていないが、リスインはしている
			await api('/users/lists/push', { listId: list.id, userId: remote.id }, alice);
			await sleep(1000);

			return { list, alice, bob, carol, remote };
		}

		const eachTableDefault = {
			'自分のノート': 'は含まれる',
			'自分の visibility: home なノート': 'は含まれる',
			'自分の visibility: followers なノート': 'は含まれない',
			'自分の自分自身宛ての visibility: specified なノート': 'は含まれる',
			'自分の他人宛ての visibility: specified なノート': 'は含まれない',
			'自分の自分自身への返信': 'は含まれる',
			'自分の他人への返信': 'は含まれない',
			'自分のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'他人のノート': 'は含まれる',
			'他人のファイル付きノート': 'は含まれる',
			'他人の visibility: home なノート': 'は含まれる',
			'他人の visibility: followers なノート': 'は含まれない',
			'他人の他人自身宛ての visibility: specified なノート': 'は含まれない',
			'他人の別の他人宛ての visibility: specified なノート': 'は含まれない',
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれない',
			'他人の自分の visibility: specified なノートへの返信': 'は含まれる',
			'他人のリモートユーザーのノート': 'は含まれる',
			'他人のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのノート': 'は含まれる',
			'フォローしているユーザーのファイル付きノート': 'は含まれる',
			'フォローしているユーザーの visibility: home なノート': 'は含まれる',
			'フォローしているユーザーの visibility: followers なノート': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれない',
			'フォローしているユーザーの他人への visibility: specified なノート': 'は含まれない',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'フォローしているリモートユーザーのノート': 'は含まれる',
			'フォローしているリモートユーザーの visibility: home なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人へのDM返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': 'は含まれない',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーのリノート': 'は含まれない',
			'フォローしているユーザーの他人の投稿の引用': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーの引用': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているかつミュートしているユーザーのノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
			'ミュートしているユーザーのノート': 'は含まれない',
			'ブロックしているユーザーのノート': 'は含まれる', // #12012
			'ブロックしてきているユーザーのノート': 'は含まれない',
		} as const satisfies Record<keyof typeof createNoteFor, IncludeOrNotNotation>;
		test.concurrent.each(tableToEntries(eachTableDefault))('[パラメタ指定なし] %#. リスインしている%s%s', async (key, value) => {
			const { list, alice, bob, carol, remote } = await listedUsers();
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/user-list-timeline',
				parameters: { listId: list.id, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれない',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれない',
		}))('[withRenotes: false] %#. リスインしている%s%s', async (key, value) => {
			const { list, alice, bob, carol, remote } = await listedUsers();
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/notes/user-list-timeline',
				parameters: { listId: list.id, withRenotes: false, limit: 100 },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);
	});

	describe('User TL', () => {
		const eachTableDefault = {
			'自分のノート': 'は含まれる',
			'自分の visibility: home なノート': 'は含まれる',
			'自分の visibility: followers なノート': 'は含まれる', // 457b4cf users/notes で 自身の visibility: followers なノートが含まれない問題を修正
			'自分の自分自身宛ての visibility: specified なノート': 'は含まれる',
			'自分の他人宛ての visibility: specified なノート': 'は含まれる',
			'自分の自分自身への返信': 'は含まれる',
			'自分の他人への返信': 'は含まれる',
			'自分のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のチャンネル投稿': 'は含まれない',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'他人のノート': 'は含まれる',
			'他人のファイル付きノート': 'は含まれる',
			'他人の visibility: home なノート': 'は含まれる',
			'他人の visibility: followers なノート': 'は含まれない',
			'他人の他人自身宛ての visibility: specified なノート': 'は含まれない',
			'他人の別の他人宛ての visibility: specified なノート': 'は含まれない',
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれる', // BUG? withRepliesなしで含まれる？
			'他人の自分の visibility: specified なノートへの返信': 'は含まれる',
			'他人のリモートユーザーのノート': 'は含まれる',
			'他人のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のチャンネル投稿': 'は含まれない',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのノート': 'は含まれる',
			'フォローしているユーザーのファイル付きノート': 'は含まれる',
			'フォローしているユーザーの visibility: home なノート': 'は含まれる',
			'フォローしているユーザーの visibility: followers なノート': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれる',
			'フォローしているユーザーの他人への visibility: specified なノート': 'は含まれない',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'フォローしているリモートユーザーのノート': 'は含まれる',
			'フォローしているリモートユーザーの visibility: home なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人へのDM返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーの他人の visibility: followers なノート': 'は含まれる',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信': 'は含まれない',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーのリノート': 'は含まれない',
			'フォローしているユーザーの他人の投稿の引用': 'は含まれる',
			'フォローしているユーザーが行ったミュートしているユーザーの引用': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない', // 854ac95 センシティブ設定されたチャンネルの投稿をusers/notesで返さないように
			'フォローしているかつミュートしているユーザーのノート': 'は含まれる',
			'フォローしているかつリノートミュートしているユーザーの他人の投稿のリノート': 'は含まれる',
			'フォローしているかつリノートミュートしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる',
			'ミュートしているユーザーのノート': 'は含まれる',
			'ブロックしているユーザーのノート': 'は含まれる', // #12012
			'ブロックしてきているユーザーのノート': 'は含まれる', // #12012#issuecomment-1759594337
		} as const satisfies Record<keyof typeof createNoteFor, IncludeOrNotNotation>;
		test.concurrent.each(tableToEntries(eachTableDefault))('[パラメタ指定なし] %#. %sは投稿したユーザーのユーザーTLに%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/users/notes',
				parameters: { userId: createdPost.userId },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			'フォローしているユーザーの他人の投稿のリノート': 'は含まれる', // BUG?
			'フォローしているユーザーの他人のファイル付き投稿のリノート': 'は含まれる', // BUG?
		}))('[withRenotes: false] %#. %sは投稿したユーザーのユーザーTLに%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/users/notes',
				parameters: { userId: createdPost.userId, withRenotes: false },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			...eachTableDefault,
			'他人の自分への返信': 'は含まれる',
			'他人の他人自身への返信': 'は含まれる',
			'他人の別の他人への返信': 'は含まれる',
			'フォローしているユーザーの自分への返信': 'は含まれる',
			'フォローしているユーザーの他人への返信': 'は含まれる',
			'フォローしているユーザーのそのユーザー自身への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーの他人への返信': 'は含まれる',
			'withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信': 'は含まれない',
		}))('[withReplies: true] %#. %sは投稿したユーザーのユーザーTLに%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/users/notes',
				parameters: { userId: createdPost.userId, withReplies: true },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);

		test.concurrent.each(tableToEntries({
			...eachTableDefault,
			'自分のチャンネル投稿': 'は含まれる',
			'自分のフォロー中のチャンネル投稿': 'は含まれる',
			'自分のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれる',
			'他人のチャンネル投稿': 'は含まれる',
			'他人のフォロー中のチャンネル投稿': 'は含まれる',
			'他人のフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
			'フォローしているユーザーのチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのフォロー中のチャンネル投稿': 'は含まれる',
			'フォローしているユーザーのフォロー中のセンシティブ設定のチャンネル投稿': 'は含まれない',
		}))('[withChannelNotes: true, withReplies: true] %#. %sは投稿したユーザーのユーザーTLに%s', async (key, value) => {
			const [alice, bob, carol, remote] = await Promise.all([signup(), signup(), signup(), signup({ host: genHost() })]);
			const createdPost = await createNoteFor[key]({ alice, bob, carol, remote });
			await waitForPushToTl();
			const res: misskey.entities.Note[] = await successfulApiCall({
				endpoint: '/users/notes',
				parameters: { userId: createdPost.userId, withChannelNotes: true, withReplies: true },
				user: alice,
			});
			const responseNote = res.filter((note) => note.id === createdPost.id);
			if (includeOrNot(value)) {
				assert.strictEqual(responseNote.length, 1);
				assert.strictEqual(responseNote[0]?.text, createdPost.text);
			} else {
				assert.strictEqual(responseNote.length, 0);
			}
		}, 1000 * 30);
	});

	// TODO: ページネーションのテスト
});
