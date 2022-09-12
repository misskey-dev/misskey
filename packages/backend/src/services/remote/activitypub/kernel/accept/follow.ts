import { CacheableRemoteUser } from '@/models/entities/user.js';
import accept from '@/services/following/requests/accept.js';
import { IFollow } from '../../type.js';
import DbResolver from '../../db-resolver.js';
import { relayAccepted } from '@/services/relay.js';

export default async (actor: CacheableRemoteUser, activity: IFollow): Promise<string> => {
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
		return await relayAccepted(match[1]);
	}

	await accept(actor, follower);
	return `ok`;
};
