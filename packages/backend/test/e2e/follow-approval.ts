/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { api, signup } from '../utils.js';

describe('アカウント作成後の期間によるフォロー承認', () => {
	test('設定の初期値はnullで、項目ごとに更新・リセットでき、本人以外には公開されない', async () => {
		const user = await signup();
		const initial = await api('i', {}, user);
		expect(initial.body).toMatchObject({ followApprovalLocalSeconds: null, followApprovalRemoteSeconds: null });
		const updated = await api('i/update', { followApprovalLocalSeconds: 43200, followApprovalRemoteSeconds: 86400 }, user);
		expect(updated.status).toBe(200);
		expect(updated.body).toMatchObject({ followApprovalLocalSeconds: 43200, followApprovalRemoteSeconds: 86400 });
		const reset = await api('i/update', { followApprovalLocalSeconds: null }, user);
		expect(reset.body).toMatchObject({ followApprovalLocalSeconds: null, followApprovalRemoteSeconds: 86400 });
		const persisted = await api('i', {}, user);
		expect(persisted.body).toMatchObject({ followApprovalLocalSeconds: null, followApprovalRemoteSeconds: 86400 });
		const publicUser = await api('users/show', { userId: user.id });
		expect(publicUser.body).not.toHaveProperty('followApprovalLocalSeconds');
		expect(publicUser.body).not.toHaveProperty('followApprovalRemoteSeconds');
	});

	test('ローカル・リモートの両方で上限の30日を受け付ける', async () => {
		const user = await signup();
		const res = await api('i/update', { followApprovalLocalSeconds: 2592000, followApprovalRemoteSeconds: 2592000 }, user);
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ followApprovalLocalSeconds: 2592000, followApprovalRemoteSeconds: 2592000 });
	});

	test.each([-1, 1.5, 2592001])('不正な期間を拒否する: %s秒', async seconds => {
		const user = await signup();
		for (const key of ['followApprovalLocalSeconds', 'followApprovalRemoteSeconds']) {
			const res = await api('i/update', { [key]: seconds }, user);
			expect(res.status).toBe(400);
		}
	});

	test('作成直後のローカルユーザーからのフォローを保留し、手動で承認できる', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { followApprovalLocalSeconds: 43200 }, receiver);
		expect((await api('following/create', { userId: receiver.id }, follower)).status).toBe(200);
		const pending = await api('users/show', { userId: receiver.id }, follower);
		expect(pending.body).toMatchObject({ isFollowing: false, hasPendingFollowRequestFromYou: true });
		expect((await api('following/requests/accept', { userId: follower.id }, receiver)).status).toBe(204);
		const accepted = await api('users/show', { userId: receiver.id }, follower);
		expect(accepted.body).toMatchObject({ isFollowing: true, hasPendingFollowRequestFromYou: false });
	});

	test.each([null, 0])('期間の設定値が %s の場合は即座にフォローが成立する', async seconds => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { followApprovalLocalSeconds: seconds }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		const result = await api('users/show', { userId: receiver.id }, follower);
		expect(result.body).toMatchObject({ isFollowing: true, hasPendingFollowRequestFromYou: false });
	});

	test('リモート用の期間だけを設定してもローカルユーザーのフォローは保留しない', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { followApprovalRemoteSeconds: 43200 }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('users/show', { userId: receiver.id }, follower)).body.isFollowing).toBe(true);
	});

	test('フォローしている相手の自動承認を維持する', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { followApprovalLocalSeconds: 43200, autoAcceptFollowed: true }, receiver);
		await api('following/create', { userId: follower.id }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('users/show', { userId: receiver.id }, follower)).body.isFollowing).toBe(true);
	});

	test('期間による承認を無効にしても鍵アカウントへのフォローには承認が必要になる', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { followApprovalLocalSeconds: 0, isLocked: true }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isFollowing: false, hasPendingFollowRequestFromYou: true });
	});

	test('鍵を解除しても指定期間に達していない相手のリクエストは保留される', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { isLocked: true, followApprovalLocalSeconds: 43200 }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('i/update', { isLocked: false }, receiver)).status).toBe(200);
		expect((await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isLocked: false, isFollowing: false, hasPendingFollowRequestFromYou: true });
	});

	test('指定期間を経過した相手のリクエストは鍵の解除時に承認される', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { isLocked: true, followApprovalLocalSeconds: 1 }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		await expect.poll(() => Date.now() - Date.parse(follower.createdAt), { timeout: 5000 })
			.toBeGreaterThanOrEqual(1000);
		expect((await api('i/update', { isLocked: false }, receiver)).status).toBe(200);
		await expect.poll(async () => (await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isFollowing: true, hasPendingFollowRequestFromYou: false });
	});

	test.each([null, 0])('鍵の解除と同時に期間の設定を %s に変更するとリクエストが承認される', async seconds => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { isLocked: true, followApprovalLocalSeconds: 43200 }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('i/update', { isLocked: false, followApprovalLocalSeconds: seconds }, receiver)).status).toBe(200);
		await expect.poll(async () => (await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isFollowing: true, hasPendingFollowRequestFromYou: false });
	});

	test('鍵の解除と同時に期間による承認を有効にすると更新後の設定で保留される', async () => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { isLocked: true }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		expect((await api('i/update', { isLocked: false, followApprovalLocalSeconds: 43200 }, receiver)).status).toBe(200);
		expect((await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isFollowing: false, hasPendingFollowRequestFromYou: true });
	});

	test.each([false, true])('保留後にフォローした相手は鍵の解除時も自動承認設定に従う（自動承認: %s）', async autoAcceptFollowed => {
		const receiver = await signup();
		const follower = await signup();
		await api('i/update', { isLocked: true, followApprovalLocalSeconds: 43200, autoAcceptFollowed }, receiver);
		await api('following/create', { userId: receiver.id }, follower);
		await api('following/create', { userId: follower.id }, receiver);
		expect((await api('i/update', { isLocked: false }, receiver)).status).toBe(200);
		expect((await api('users/show', { userId: receiver.id }, follower)).body)
			.toMatchObject({ isFollowing: autoAcceptFollowed, hasPendingFollowRequestFromYou: !autoAcceptFollowed });
	});
});
