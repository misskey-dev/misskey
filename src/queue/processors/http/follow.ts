import User, { isLocalUser, isRemoteUser, pack as packUser } from '../../../models/user';
import Following from '../../../models/following';
import FollowingLog from '../../../models/following-log';
import FollowedLog from '../../../models/followed-log';
import event from '../../../publishers/stream';
import notify from '../../../publishers/notify';
import context from '../../../remote/activitypub/renderer/context';
import render from '../../../remote/activitypub/renderer/follow';
import request from '../../../remote/request';

export default ({ data }, done) => Following.findOne({ _id: data.following }).then(async ({ followerId, followeeId }) => {
	const [follower, followee] = await Promise.all([
		User.findOne({ _id: followerId }),
		User.findOne({ _id: followeeId })
	]);

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const rendered = render(follower, followee);
		rendered['@context'] = context;

		await request(follower, followee.account.inbox, rendered);
	}

	return [follower, followee];
}).then(([follower, followee]) => Promise.all([
	// Increment following count
	User.update(follower._id, {
		$inc: {
			followingCount: 1
		}
	}),

	FollowingLog.insert({
		createdAt: data.following.createdAt,
		userId: follower._id,
		count: follower.followingCount + 1
	}),

	// Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	}),

	FollowedLog.insert({
		createdAt: data.following.createdAt,
		userId: follower._id,
		count: followee.followersCount + 1
	}),

	// Publish follow event
	isLocalUser(follower) && packUser(followee, follower)
		.then(packed => event(follower._id, 'follow', packed)),

	isLocalUser(followee) && Promise.all([
		packUser(follower, followee)
			.then(packed => event(followee._id, 'followed', packed)),

		// Notify
		isLocalUser(followee) && notify(followee._id, follower._id, 'follow')
	])
]).then(() => done(), error => {
	done();
	throw error;
}), done);
