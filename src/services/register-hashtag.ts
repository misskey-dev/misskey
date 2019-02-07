import { IUser } from '../models/user';
import Hashtag from '../models/hashtag';
import hashtagChart from '../services/chart/hashtag';

export default async function(user: IUser, tag: string) {
	tag = tag.toLowerCase();

	const index = await Hashtag.findOne({ tag });

	if (index != null) {
		// 自分が初めてこのタグを使ったなら
		if (!index.mentionedUserIds.some(id => id.equals(user._id))) {
			Hashtag.update({ tag }, {
				$push: {
					mentionedUserIds: user._id
				},
				$inc: {
					mentionedUserIdsCount: 1
				}
			});
		}
	} else {
		Hashtag.insert({
			tag,
			mentionedUserIds: [user._id],
			mentionedUserIdsCount: 1
		});
	}

	hashtagChart.update(tag, user);
}
