import * as mongodb from 'mongodb';
import Following from '../../../models/following';

export default async (me: mongodb.ObjectID, includeMe: boolean = true) => {
	// Fetch relation to other users who the I follows
	// SELECT followee
	const myfollowing = await Following
		.find({
			followerId: me
		}, {
			fields: {
				followeeId: true
			}
		});

	// ID list of other users who the I follows
	const myfollowingIds = myfollowing.map(follow => follow.followeeId);

	if (includeMe) {
		myfollowingIds.push(me);
	}

	return myfollowingIds;
};
