import * as mongo from 'mongodb';
import User, { isLocalUser, isRemoteUser } from '../../models/user';
import Following from '../../models/following';
import renderPerson from '../../remote/activitypub/renderer/person';
import renderUpdate from '../../remote/activitypub/renderer/update';
import packAp from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';

export async function publishToFollowers(userId: mongo.ObjectID) {
	const user = await User.findOne({
		_id: userId
	});

	const followers = await Following.find({
		followeeId: user._id
	});

	const queue: string[] = [];

	// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
	if (isLocalUser(user)) {
		followers.map(following => {
			const follower = following._follower;

			if (isRemoteUser(follower)) {
				const inbox = follower.sharedInbox || follower.inbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		});

		if (queue.length > 0) {
			const content = packAp(renderUpdate(await renderPerson(user), user));
			queue.forEach(inbox => {
				deliver(user, content, inbox);
			});
		}
	}
}
