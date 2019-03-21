import { IUser, isLocalUser, isRemoteUser } from '../models/user';
import Hashtag from '../models/hashtag';
import hashtagChart from './chart/charts/hashtag';

export async function updateHashtag(user: IUser, tag: string, isUserAttached = false, inc = true) {
	tag = tag.toLowerCase();

	const index = await Hashtag.findOne({ tag });

	if (index == null && !inc) return;

	if (index != null) {
		const $push = {} as any;
		const $pull = {} as any;
		const $inc = {} as any;

		if (isUserAttached) {
			if (inc) {
				// 自分が初めてこのタグを使ったなら
				if (!index.attachedUserIds.some(id => id.equals(user.id))) {
					$push.attachedUserIds = user.id;
					$inc.attachedUsersCount = 1;
				}
				// 自分が(ローカル内で)初めてこのタグを使ったなら
				if (isLocalUser(user) && !index.attachedLocalUserIds.some(id => id.equals(user.id))) {
					$push.attachedLocalUserIds = user.id;
					$inc.attachedLocalUsersCount = 1;
				}
				// 自分が(リモートで)初めてこのタグを使ったなら
				if (isRemoteUser(user) && !index.attachedRemoteUserIds.some(id => id.equals(user.id))) {
					$push.attachedRemoteUserIds = user.id;
					$inc.attachedRemoteUsersCount = 1;
				}
			} else {
				$pull.attachedUserIds = user.id;
				$inc.attachedUsersCount = -1;
				if (isLocalUser(user)) {
					$pull.attachedLocalUserIds = user.id;
					$inc.attachedLocalUsersCount = -1;
				} else {
					$pull.attachedRemoteUserIds = user.id;
					$inc.attachedRemoteUsersCount = -1;
				}
			}
		} else {
			// 自分が初めてこのタグを使ったなら
			if (!index.mentionedUserIds.some(id => id.equals(user.id))) {
				$push.mentionedUserIds = user.id;
				$inc.mentionedUsersCount = 1;
			}
			// 自分が(ローカル内で)初めてこのタグを使ったなら
			if (isLocalUser(user) && !index.mentionedLocalUserIds.some(id => id.equals(user.id))) {
				$push.mentionedLocalUserIds = user.id;
				$inc.mentionedLocalUsersCount = 1;
			}
			// 自分が(リモートで)初めてこのタグを使ったなら
			if (isRemoteUser(user) && !index.mentionedRemoteUserIds.some(id => id.equals(user.id))) {
				$push.mentionedRemoteUserIds = user.id;
				$inc.mentionedRemoteUsersCount = 1;
			}
		}

		const q = {} as any;
		if (Object.keys($push).length > 0) q.$push = $push;
		if (Object.keys($pull).length > 0) q.$pull = $pull;
		if (Object.keys($inc).length > 0) q.$inc = $inc;
		if (Object.keys(q).length > 0) Hashtag.update({ tag }, q);
	} else {
		if (isUserAttached) {
			Hashtag.insert({
				tag,
				mentionedUserIds: [],
				mentionedUsersCount: 0,
				mentionedLocalUserIds: [],
				mentionedLocalUsersCount: 0,
				mentionedRemoteUserIds: [],
				mentionedRemoteUsersCount: 0,
				attachedUserIds: [user.id],
				attachedUsersCount: 1,
				attachedLocalUserIds: isLocalUser(user) ? [user.id] : [],
				attachedLocalUsersCount: isLocalUser(user) ? 1 : 0,
				attachedRemoteUserIds: isRemoteUser(user) ? [user.id] : [],
				attachedRemoteUsersCount: isRemoteUser(user) ? 1 : 0,
			});
		} else {
			Hashtag.insert({
				tag,
				mentionedUserIds: [user.id],
				mentionedUsersCount: 1,
				mentionedLocalUserIds: isLocalUser(user) ? [user.id] : [],
				mentionedLocalUsersCount: isLocalUser(user) ? 1 : 0,
				mentionedRemoteUserIds: isRemoteUser(user) ? [user.id] : [],
				mentionedRemoteUsersCount: isRemoteUser(user) ? 1 : 0,
				attachedUserIds: [],
				attachedUsersCount: 0,
				attachedLocalUserIds: [],
				attachedLocalUsersCount: 0,
				attachedRemoteUserIds: [],
				attachedRemoteUsersCount: 0,
			});
		}
	}

	if (!isUserAttached) {
		hashtagChart.update(tag, user);
	}
}
