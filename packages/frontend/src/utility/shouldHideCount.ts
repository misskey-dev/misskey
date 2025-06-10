import * as Misskey from 'misskey-js';
import { $i } from '@/i.js';
import { prefer } from '@/preferences.js';

export function shouldHideNotesCount(user: Misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) {
		return !!prefer.s.hideNotesCountMyself;
	}
	return !!prefer.s.hideNotesCountOthers;
}

export function shouldHideFollowingCount(user: Misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) {
		return !!prefer.s.hideFollowingCountMyself;
	}
	return !!prefer.s.hideFollowingCountOthers;
}

export function shouldHideFollowersCount(user: Misskey.entities.UserDetailed): boolean {
	if ($i && $i.id === user.id) {
		return !!prefer.s.hideFollowersCountMyself;
	}
	return !!prefer.s.hideFollowersCountOthers;
}
