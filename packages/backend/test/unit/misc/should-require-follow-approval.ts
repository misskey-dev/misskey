/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { shouldRequireFollowApproval } from '@/misc/should-require-follow-approval.js';

describe('アカウント作成後の期間によるフォロー承認の判定', () => {
	const now = Date.UTC(2026, 0, 15);
	const day = 86400000;
	const settings = { followApprovalLocalSeconds: 7 * 86400, followApprovalRemoteSeconds: 14 * 86400 };

	test('相手がローカルならローカル用、リモートならリモート用の期間で判定する', () => {
		const createdAt = new Date(now - 10 * day);
		expect(shouldRequireFollowApproval(settings, false, createdAt, now)).toBe(false);
		expect(shouldRequireFollowApproval(settings, true, createdAt, now)).toBe(true);
	});

	test.each([false, true])('指定期間に達した時点で承認が不要になる（リモート: %s）', remote => {
		const days = remote ? 14 : 7;
		expect(shouldRequireFollowApproval(settings, remote, new Date(now - days * day + 1), now)).toBe(true);
		expect(shouldRequireFollowApproval(settings, remote, new Date(now - days * day), now)).toBe(false);
		expect(shouldRequireFollowApproval(settings, remote, new Date(now - days * day - 1), now)).toBe(false);
	});

	test('秒単位で指定した半日の期間で判定できる', () => {
		const halfDay = { followApprovalLocalSeconds: 43200, followApprovalRemoteSeconds: 43200 };
		expect(shouldRequireFollowApproval(halfDay, false, new Date(now - 12 * 3600000 + 1), now)).toBe(true);
		expect(shouldRequireFollowApproval(halfDay, true, new Date(now - 12 * 3600000), now)).toBe(false);
	});

	test.each([null, 0])('設定値が %s の場合は、認識直後のリモートアカウントでも承認を要求しない', days => {
		const disabled = { followApprovalLocalSeconds: days, followApprovalRemoteSeconds: days };
		expect(shouldRequireFollowApproval(disabled, false, new Date(now), now)).toBe(false);
		expect(shouldRequireFollowApproval(disabled, true, new Date(now), now)).toBe(false);
	});
});
