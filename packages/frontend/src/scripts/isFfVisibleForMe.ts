/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i } from '@/account.js';

export function isFollowingVisibleForMe(user: Misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) return true;

	if (user.followingVisibility === 'private') return false;
	if (user.followingVisibility === 'followers' && !user.isFollowing) return false;

	return true;
}
export function isFollowerVisibleForMe(user: Misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) return true;

	if (user.followerVisibility === 'private') return false;
	if (user.followerVisibility === 'followers' && !user.isFollowing) return false;

	return true;
}
