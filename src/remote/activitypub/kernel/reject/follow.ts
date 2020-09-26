import { IRemoteUser } from '../../../../models/entities/user';
import reject from '../../../../services/following/requests/reject';
import { IFollow } from '../../type';
import DbResolver from '../../db-resolver';
import { relayRejected } from '../../../../services/relay';

export default async (actor: IRemoteUser, activity: IFollow): Promise<string> => {
	// ※ activityはこっちから投げたフォローリクエストなので、activity.actorは存在するローカルユーザーである必要がある

	const dbResolver = new DbResolver();
	const follower = await dbResolver.getUserFromApId(activity.actor);

	if (follower == null) {
		return `skip: follower not found`;
	}

	if (follower.host != null) {
		return `skip: follower is not a local user`;
	}

	// relay
	const match = activity.id?.match(/follow-relay\/(\w+)/);
	if (match) {
		return await relayRejected(match[1]);
	}

	await reject(actor, follower);
	return `ok`;
};
