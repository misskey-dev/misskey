/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiUserProfile } from '@/models/UserProfile.js';

export function shouldRequireFollowApproval(
	profile: Pick<MiUserProfile, 'followApprovalLocalSeconds' | 'followApprovalRemoteSeconds'>,
	isRemote: boolean,
	createdAt: Date,
	now = Date.now(),
): boolean {
	// アカウント作成からの経過時間がフォロー承認の必要時間より短い場合、承認が必要とする
	// 必要時間が0または未設定の場合、承認は不要とする
	const seconds = (isRemote ? profile.followApprovalRemoteSeconds : profile.followApprovalLocalSeconds) ?? 0;
	return seconds > 0 && now - createdAt.getTime() < seconds * 1000;
}
