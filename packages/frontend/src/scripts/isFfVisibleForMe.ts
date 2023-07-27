import * as misskey from 'misskey-js';
import { $i } from '@/account';

export function isFfVisibleForMe(user: misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) return true;

	if (user.ffVisibility === 'private') return false;
	if (user.ffVisibility === 'followers' && !user.isFollowing) return false;

	return true;
}
