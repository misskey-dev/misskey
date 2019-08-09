import Resolver from '~/remote/activitypub/resolver';
import deleteNote from './note';
import { IRemoteUser } from '~/models/entities/user';
import { IDelete, getApId, validPost } from '~/remote/activitypub/type';
import { apLogger } from '~/remote/activitypub/logger';

/**
 * 削除アクティビティを捌きます
 */
export default async (actor: IRemoteUser, activity: IDelete): Promise<void> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object);

	const uri = getApId(object);

	if (validPost.includes(object.type) || object.type === 'Tombstone') {
		deleteNote(actor, uri);
	} else {
		apLogger.warn(`Unknown type: ${object.type}`);
	}
};
