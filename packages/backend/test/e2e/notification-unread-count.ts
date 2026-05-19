/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import { beforeAll, beforeEach, describe, test } from 'vitest';
import { api, post, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

// このテストは https://github.com/misskey-dev/misskey/issues/17427
// 「通知バルーンが消えない問題」の回帰防止。
//
// 旧 UserEntityService.getNotificationsInfo() は Redis Stream の生エントリ数で
// 未読カウントを返していたため、packMany で除外される通知 (解決済みフォロー
// リクエスト・削除済みノート・サスペンドされた notifier 等) もカウントに含まれ、
// 「通知ページを開いても何もないのにバッジだけ残る」状態を引き起こしていた。
//
// 修正後は packMany 相当のバリデータを通した件数を返すため、
// API レスポンスとバッジカウントは常に一致する。
describe('Notification unread count consistency (misskey-dev/misskey#17427)', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice_n17427' });
		bob = await signup({ username: 'bob_n17427' });
	}, 1000 * 60 * 2);

	// 各テスト間で Stream エントリ自体を破棄してテスト間の汚染を防ぐ。
	// mark-all-as-read だと latestReadNotificationId を進めるだけで Stream は残る。
	beforeEach(async () => {
		await api('notifications/flush', {}, alice);
		await api('notifications/flush', {}, bob);
		await setTimeout(500);
	});

	test('承認済みフォローリクエスト通知は表示されず、カウントにも含まれない', async () => {
		// alice をロックする → bob がフォローするとフォローリクエストになる
		await api('i/update', { isLocked: true }, alice);

		// bob → alice フォローリクエスト発生 (alice に receiveFollowRequest 通知)
		await api('following/create', { userId: alice.id }, bob);

		// createNotification の setTimeout(2000) 後に unreadNotification が発火するため待機
		await setTimeout(2500);

		// 承認前: 通知が 1 件未読として見える状態
		const beforeAccept = await api('i', {}, alice);
		assert.strictEqual(beforeAccept.status, 200);
		assert.strictEqual(beforeAccept.body.unreadNotificationsCount, 1,
			'承認前: フォローリクエスト通知でカウント 1');
		assert.strictEqual(beforeAccept.body.hasUnreadNotification, true);

		// alice 側で承認 → receiveFollowRequest が解決済みになる &
		// 同時に follow 通知が新規発生する (フォロワー追加の通知)
		await api('following/requests/accept', { userId: bob.id }, alice);
		await setTimeout(200);

		// 承認後の状態を観測する。
		// markAsRead=false で内部の readAllNotification を呼ばないようにする
		const afterAcceptI = await api('i', {}, alice);
		const notificationsRes = await api('i/notifications', { markAsRead: false }, alice);
		assert.strictEqual(notificationsRes.status, 200);

		// receiveFollowRequest 通知は packMany で除外されているはず
		const remainingReceiveFollowRequest = notificationsRes.body.filter(
			(n: { type: string }) => n.type === 'receiveFollowRequest',
		);
		assert.strictEqual(remainingReceiveFollowRequest.length, 0,
			'承認後: 解決済みの receiveFollowRequest 通知は API レスポンスに現れない');

		// 修正の本旨: バッジカウントは API レスポンスの件数と一致する
		assert.strictEqual(afterAcceptI.body.unreadNotificationsCount, notificationsRes.body.length,
			'unreadNotificationsCount は packMany フィルタ後の件数と一致する (Stream の生件数ではなく)');

		// 後片付け
		await api('i/update', { isLocked: false }, alice);
		await api('following/delete', { userId: alice.id }, bob);
	}, 1000 * 30);

	test('mention 通知が来たときは API 件数 = バッジカウントが揃う', async () => {
		await post(bob, { text: `@alice_n17427 hi ${Date.now()}` });
		// createNotificationInternal の setTimeout(2000) 経過待ち
		await setTimeout(2500);

		const userInfo = await api('i', {}, alice);
		const notificationsRes = await api('i/notifications', { markAsRead: false }, alice);

		assert.strictEqual(userInfo.body.unreadNotificationsCount, notificationsRes.body.length,
			'unreadNotificationsCount は packMany フィルタ後の件数と一致する');
		assert.ok(userInfo.body.unreadNotificationsCount >= 1,
			'mention 通知 1 件以上で unreadNotificationsCount >= 1');
	}, 1000 * 30);

	test('元のメンション元ノートが削除されると、その通知はカウントから除外される', async () => {
		// bob から alice にメンション → alice に通知が立つ
		const bobNote = await post(bob, { text: `@alice_n17427 will be deleted ${Date.now()}` });
		await setTimeout(2500);

		// 通知が立った状態を確認
		const beforeDelete = await api('i', {}, alice);
		assert.ok(beforeDelete.body.unreadNotificationsCount >= 1, 'ノート削除前はカウント >= 1');

		// bob がノートを削除する → packMany で「ノート無し」として除外されるはず
		await api('notes/delete', { noteId: bobNote.id }, bob);
		await setTimeout(500);

		const afterDelete = await api('i', {}, alice);
		const notificationsRes = await api('i/notifications', { markAsRead: false }, alice);

		// API レスポンスから該当通知が消えていることを確認
		const stillVisible = notificationsRes.body.filter(
			(n: { type: string; note?: { id: string } }) => n.type === 'mention' && n.note?.id === bobNote.id,
		);
		assert.strictEqual(stillVisible.length, 0,
			'ノート削除後: mention 通知は packMany で除外され API レスポンスに現れない');

		// バッジカウントも同様に減っているはず (修正前は Stream に残っていたのでカウントだけ残る現象が出た)
		assert.strictEqual(afterDelete.body.unreadNotificationsCount, notificationsRes.body.length,
			'ノート削除後: unreadNotificationsCount は API レスポンス件数と一致する');
	}, 1000 * 30);
});
