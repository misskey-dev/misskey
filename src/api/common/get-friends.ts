import * as mongodb from 'mongodb';
import Following from '../models/following';

export default async (me: mongodb.ObjectID, includeMe: boolean = true) => {
	// Fetch relation to other users who the I follows
	// SELECT followee
	const myfollowing = await Following
		.find({
			follower_id: me,
			// 削除されたドキュメントは除く
			deleted_at: { $exists: false }
		}, {
			followee_id: true
		})
		.toArray();

	// ID list of other users who the I follows
	const myfollowingIds = myfollowing.map(follow => follow.followee_id);

	if (includeMe) {
		myfollowingIds.push(me);
	}

	return myfollowingIds;
};
