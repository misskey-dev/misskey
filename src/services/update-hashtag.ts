import { User } from '../models/entities/user';
import { Hashtags, Users } from '../models';
import { hashtagChart } from './chart';
import { genId } from '../misc/gen-id';
import { Hashtag } from '../models/entities/hashtag';
import { normalizeForSearch } from '../misc/normalize-for-search';

export async function updateHashtags(user: User, tags: string[]) {
	for (const tag of tags) {
		await updateHashtag(user, tag);
	}
}

export async function updateUsertags(user: User, tags: string[]) {
	for (const tag of tags) {
		await updateHashtag(user, tag, true, true);
	}

	for (const tag of (user.tags || []).filter(x => !tags.includes(x))) {
		await updateHashtag(user, tag, true, false);
	}
}

export async function updateHashtag(user: User, tag: string, isUserAttached = false, inc = true) {
	tag = normalizeForSearch(tag);

	const index = await Hashtags.findOne({ name: tag });

	if (index == null && !inc) return;

	if (index != null) {
		const q = Hashtags.createQueryBuilder('tag').update()
			.where('name = :name', { name: tag });

		const set = {} as any;

		if (isUserAttached) {
			if (inc) {
				// 自分が初めてこのタグを使ったなら
				if (!index.attachedUserIds.some(id => id === user.id)) {
					set.attachedUserIds = () => `array_append("attachedUserIds", '${user.id}')`;
					set.attachedUsersCount = () => `"attachedUsersCount" + 1`;
				}
				// 自分が(ローカル内で)初めてこのタグを使ったなら
				if (Users.isLocalUser(user) && !index.attachedLocalUserIds.some(id => id === user.id)) {
					set.attachedLocalUserIds = () => `array_append("attachedLocalUserIds", '${user.id}')`;
					set.attachedLocalUsersCount = () => `"attachedLocalUsersCount" + 1`;
				}
				// 自分が(リモートで)初めてこのタグを使ったなら
				if (Users.isRemoteUser(user) && !index.attachedRemoteUserIds.some(id => id === user.id)) {
					set.attachedRemoteUserIds = () => `array_append("attachedRemoteUserIds", '${user.id}')`;
					set.attachedRemoteUsersCount = () => `"attachedRemoteUsersCount" + 1`;
				}
			} else {
				set.attachedUserIds = () => `array_remove("attachedUserIds", '${user.id}')`;
				set.attachedUsersCount = () => `"attachedUsersCount" - 1`;
				if (Users.isLocalUser(user)) {
					set.attachedLocalUserIds = () => `array_remove("attachedLocalUserIds", '${user.id}')`;
					set.attachedLocalUsersCount = () => `"attachedLocalUsersCount" - 1`;
				} else {
					set.attachedRemoteUserIds = () => `array_remove("attachedRemoteUserIds", '${user.id}')`;
					set.attachedRemoteUsersCount = () => `"attachedRemoteUsersCount" - 1`;
				}
			}
		} else {
			// 自分が初めてこのタグを使ったなら
			if (!index.mentionedUserIds.some(id => id === user.id)) {
				set.mentionedUserIds = () => `array_append("mentionedUserIds", '${user.id}')`;
				set.mentionedUsersCount = () => `"mentionedUsersCount" + 1`;
			}
			// 自分が(ローカル内で)初めてこのタグを使ったなら
			if (Users.isLocalUser(user) && !index.mentionedLocalUserIds.some(id => id === user.id)) {
				set.mentionedLocalUserIds = () => `array_append("mentionedLocalUserIds", '${user.id}')`;
				set.mentionedLocalUsersCount = () => `"mentionedLocalUsersCount" + 1`;
			}
			// 自分が(リモートで)初めてこのタグを使ったなら
			if (Users.isRemoteUser(user) && !index.mentionedRemoteUserIds.some(id => id === user.id)) {
				set.mentionedRemoteUserIds = () => `array_append("mentionedRemoteUserIds", '${user.id}')`;
				set.mentionedRemoteUsersCount = () => `"mentionedRemoteUsersCount" + 1`;
			}
		}

		if (Object.keys(set).length > 0) {
			q.set(set);
			q.execute();
		}
	} else {
		if (isUserAttached) {
			Hashtags.save({
				id: genId(),
				name: tag,
				mentionedUserIds: [],
				mentionedUsersCount: 0,
				mentionedLocalUserIds: [],
				mentionedLocalUsersCount: 0,
				mentionedRemoteUserIds: [],
				mentionedRemoteUsersCount: 0,
				attachedUserIds: [user.id],
				attachedUsersCount: 1,
				attachedLocalUserIds: Users.isLocalUser(user) ? [user.id] : [],
				attachedLocalUsersCount: Users.isLocalUser(user) ? 1 : 0,
				attachedRemoteUserIds: Users.isRemoteUser(user) ? [user.id] : [],
				attachedRemoteUsersCount: Users.isRemoteUser(user) ? 1 : 0,
			} as Hashtag);
		} else {
			Hashtags.save({
				id: genId(),
				name: tag,
				mentionedUserIds: [user.id],
				mentionedUsersCount: 1,
				mentionedLocalUserIds: Users.isLocalUser(user) ? [user.id] : [],
				mentionedLocalUsersCount: Users.isLocalUser(user) ? 1 : 0,
				mentionedRemoteUserIds: Users.isRemoteUser(user) ? [user.id] : [],
				mentionedRemoteUsersCount: Users.isRemoteUser(user) ? 1 : 0,
				attachedUserIds: [],
				attachedUsersCount: 0,
				attachedLocalUserIds: [],
				attachedLocalUsersCount: 0,
				attachedRemoteUserIds: [],
				attachedRemoteUsersCount: 0,
			} as Hashtag);
		}
	}

	if (!isUserAttached) {
		hashtagChart.update(tag, user);
	}
}
