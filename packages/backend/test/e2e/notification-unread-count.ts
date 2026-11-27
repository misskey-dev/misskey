/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import * as Redis from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { api, post, signup, waitFire } from '../utils.js';
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

// 「通知タブを開いても未読バルーンが消えず、リロードでのみ消える」現象の切り分けテスト。
//
// フロントは通知タブを開くと i/notifications-grouped (markAsRead=true 既定) を叩き、
// バックエンドの NotificationService.readAllNotification() が既読位置を進めた場合に
// mainStream へ 'readAllNotifications' を publish する。フロントのバルーンはこの
// イベントを受けて初めて消えるため、イベントが publish されない経路が 1 つでもあると
// 「バックエンドは既読 (リロードでバッジ 0) なのにバルーンだけ残る」状態になる。
describe('Notification badge: readAllNotifications event delivery', () => {
	let carol: misskey.entities.SignupResponse;
	let dave: misskey.entities.SignupResponse;
	let redis: Redis.Redis;

	beforeAll(async () => {
		carol = await signup({ username: 'carol_n17427' });
		dave = await signup({ username: 'dave_n17427' });
		// keyPrefix はサーバー側 (RedisService) と同じく config.redis.prefix (= url のホスト名) に合わせる
		redis = new Redis.Redis({ host: '127.0.0.1', port: 56312, keyPrefix: 'misskey.local:' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		redis.disconnect();
	});

	beforeEach(async () => {
		await api('notifications/flush', {}, carol);
		await api('notifications/flush', {}, dave);
		await setTimeout(500);
	});

	test('通常フロー: 通知タブを開く (i/notifications-grouped) と readAllNotifications が飛ぶ', async () => {
		await post(dave, { text: `@carol_n17427 hi ${Date.now()}` });
		await setTimeout(2500);

		const before = await api('i', {}, carol);
		assert.ok(before.body.unreadNotificationsCount >= 1, '前提: 未読が 1 件以上ある');

		const fired = await waitFire(
			carol, 'main',
			() => api('i/notifications-grouped', {}, carol),
			msg => msg.type === 'readAllNotifications',
		);
		assert.strictEqual(fired, true,
			'通知タブを開いたら mainStream に readAllNotifications が publish されるべき');

		const after = await api('i', {}, carol);
		assert.strictEqual(after.body.unreadNotificationsCount, 0);
	}, 1000 * 30);

	test('フォロリク解決フロー: 表示 0 件でも通知タブを開けば readAllNotifications が飛ぶ', async () => {
		await api('i/update', { isLocked: true }, carol);
		await api('following/create', { userId: carol.id }, dave);
		await setTimeout(2500);

		// 通知ページを開かずにフォローリクエストページから承認する
		await api('following/requests/accept', { userId: dave.id }, carol);
		await setTimeout(2500);

		const fired = await waitFire(
			carol, 'main',
			() => api('i/notifications-grouped', {}, carol),
			msg => msg.type === 'readAllNotifications',
		);
		assert.strictEqual(fired, true,
			'表示対象が減っていても既読化イベントは publish されるべき');

		const after = await api('i', {}, carol);
		assert.strictEqual(after.body.unreadNotificationsCount, 0);

		await api('i/update', { isLocked: false }, carol);
		await api('following/delete', { userId: carol.id }, dave);
	}, 1000 * 30);

	test('同一ミリ秒に 10 件以上通知が積まれた場合でも readAllNotifications が飛ぶ (Stream ID の文字列比較の罠)', async () => {
		// 実在する通知エントリの JSON を種として使うため、まず実通知を 2 件発生させる
		await post(dave, { text: `@carol_n17427 seed1 ${Date.now()}` });
		await post(dave, { text: `@carol_n17427 seed2 ${Date.now()}` });
		await setTimeout(2500);

		const streamKey = `notificationTimeline:${carol.id}`;
		const entries = await redis.xrange(streamKey, '-', '+');
		assert.ok(entries.length >= 2, '前提: Stream に実通知が 2 件以上ある');

		const [json1, json2] = [entries[0][1][1], entries[1][1][1]];
		const lastId = entries[entries.length - 1][0];
		const baseMs = Number(lastId.split('-')[0]) + 1000;

		// 「同一 ms 内で seq=9 まで読み、その後同一 ms 内に seq=10 が積まれた」状態を再現する。
		// Redis Stream ID は数値比較では 9 < 10 だが、JS の文字列比較では '9' > '10'。
		await redis.xadd(streamKey, `${baseMs}-9`, 'data', json1);
		await redis.xadd(streamKey, `${baseMs}-10`, 'data', json2);
		await redis.set(`latestReadNotification:${carol.id}`, `${baseMs}-9`);

		const before = await api('i', {}, carol);
		assert.strictEqual(before.body.unreadNotificationsCount, 1,
			'前提: seq=10 のエントリ 1 件だけが未読 (Redis は数値比較で正しく認識する)');

		const fired = await waitFire(
			carol, 'main',
			() => api('i/notifications-grouped', {}, carol),
			msg => msg.type === 'readAllNotifications',
		);
		assert.strictEqual(fired, true,
			'未読が残っている以上、既読化時に readAllNotifications が publish されるべき');

		const after = await api('i', {}, carol);
		assert.strictEqual(after.body.unreadNotificationsCount, 0);
	}, 1000 * 30);
});
