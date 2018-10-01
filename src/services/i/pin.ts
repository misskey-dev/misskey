import config from '../../config';
import * as mongo from 'mongodb';
import User, { isLocalUser, isRemoteUser, ILocalUser } from '../../models/user';
import Following from '../../models/following';
import renderAdd from '../../remote/activitypub/renderer/add';
import renderRemove from '../../remote/activitypub/renderer/remove';
import packAp from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';

export async function deliverPinnedChange(userId: mongo.ObjectID, noteId: mongo.ObjectID, isAddition: boolean) {
	const user = await User.findOne({
		_id: userId
	});

	if (!isLocalUser(user)) return;

	const queue = await CreateRemoteInboxes(user);

	if (queue.length < 1) return;

	const target = `${config.url}/users/${user._id}/collections/featured`;

	const item = `${config.url}/notes/${noteId}`;
	const content = packAp(isAddition ? renderAdd(user, target, item) : renderRemove(user, target, item));
	queue.forEach(inbox => {
		deliver(user, content, inbox);
	});
}

/**
 * ローカルユーザーのリモートフォロワーのinboxリストを作成する
 * @param user ローカルユーザー
 */
async function CreateRemoteInboxes(user: ILocalUser): Promise<string[]> {
	const followers = await Following.find({
		followeeId: user._id
	});

	const queue: string[] = [];

	followers.map(following => {
		const follower = following._follower;

		if (isRemoteUser(follower)) {
			const inbox = follower.sharedInbox || follower.inbox;
			if (!queue.includes(inbox)) queue.push(inbox);
		}
	});

	return queue;
}
