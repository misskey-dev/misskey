import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderFollow from '@/remote/activitypub/renderer/follow';
import renderUndo from '@/remote/activitypub/renderer/undo';
import { deliver } from '@/queue/index';
import { publishMainStream } from '@/services/stream';
import { IdentifiableError } from '@/misc/identifiable-error';
import { User, ILocalUser } from '@/models/entities/user';
import { Users, FollowRequests } from '@/models/index';

export default async function(followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox'] }, follower: { id: User['id']; host: User['host']; uri: User['host'] }) {
	if (Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));

		if (Users.isLocalUser(follower)) { // 本来このチェックは不要だけどTSに怒られるので
			deliver(follower, content, followee.inbox);
		}
	}

	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (request == null) {
		throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
	}

	await FollowRequests.delete({
		followeeId: followee.id,
		followerId: follower.id,
	});

	Users.pack(followee.id, followee, {
		detail: true,
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
