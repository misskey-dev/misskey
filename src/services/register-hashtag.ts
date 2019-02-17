import { IUser, isLocalUser } from '../models/user';
import Hashtag from '../models/hashtag';
import hashtagChart from '../services/chart/hashtag';

export default async function(user: IUser, tag: string, isUserAttached = false) {
	tag = tag.toLowerCase();

	const index = await Hashtag.findOne({ tag });

	if (index != null) {
		if (isUserAttached) {
			// 自分が初めてこのタグを使ったなら
			if (!index.attachedUserIds.some(id => id.equals(user._id))) {
				Hashtag.update({ tag }, {
					$push: { attachedUserIds: user._id },
					$inc: { attachedUsersCount: 1 }
				});
			}
			// 自分が(ローカル内で)初めてこのタグを使ったなら
			if (isLocalUser(user) && !index.attachedLocalUserIds.some(id => id.equals(user._id))) {
				Hashtag.update({ tag }, {
					$push: { attachedLocalUserIds: user._id },
					$inc: { attachedLocalUsersCount: 1 }
				});
			}
		} else {
			// 自分が初めてこのタグを使ったなら
			if (!index.mentionedUserIds.some(id => id.equals(user._id))) {
				Hashtag.update({ tag }, {
					$push: { mentionedUserIds: user._id },
					$inc: { mentionedUsersCount: 1 }
				});
			}
			// 自分が(ローカル内で)初めてこのタグを使ったなら
			if (isLocalUser(user) && !index.mentionedLocalUserIds.some(id => id.equals(user._id))) {
				Hashtag.update({ tag }, {
					$push: { mentionedLocalUserIds: user._id },
					$inc: { mentionedLocalUsersCount: 1 }
				});
			}
		}
	} else {
		if (isUserAttached) {
			Hashtag.insert({
				tag,
				mentionedUserIds: [],
				mentionedUsersCount: 0,
				mentionedLocalUserIds: [],
				mentionedLocalUsersCount: 0,
				attachedUserIds: [user._id],
				attachedUsersCount: 1,
				attachedLocalUserIds: isLocalUser(user) ? [user._id] : [],
				attachedLocalUsersCount: isLocalUser(user) ? 1 : 0
			});
		} else {
			Hashtag.insert({
				tag,
				mentionedUserIds: [user._id],
				mentionedUsersCount: 1,
				mentionedLocalUserIds: isLocalUser(user) ? [user._id] : [],
				mentionedLocalUsersCount: isLocalUser(user) ? 1 : 0,
				attachedUserIds: [],
				attachedUsersCount: 0,
				attachedLocalUserIds: [],
				attachedLocalUsersCount: 0
			});
		}
	}

	if (!isUserAttached) {
		hashtagChart.update(tag, user);
	}
}
