import * as mongodb from 'mongodb';
import Following from '../../../models/following';

export const getFriendIds = async (me: mongodb.ObjectID, includeMe = true) => {
	// Fetch relation to other users who the I follows
	// SELECT followee
	const followings = await Following
		.find({
			followerId: me
		}, {
			fields: {
				followeeId: true
			}
		});

	// ID list of other users who the I follows
	const myfollowingIds = followings.map(following => following.followeeId);

	if (includeMe) {
		myfollowingIds.push(me);
	}

	return myfollowingIds;
};

export const getFriends = async (me: mongodb.ObjectID, includeMe = true) => {
	// Fetch relation to other users who the I follows
	const followings = await Following
		.find({
			followerId: me
		});

	// ID list of other users who the I follows
	const myfollowings = followings.map(following => ({
		id: following.followeeId,
		stalk: following.stalk
	}));

	if (includeMe) {
		myfollowings.push({
			id: me,
			stalk: true
		});
	}

	return myfollowings;
};
