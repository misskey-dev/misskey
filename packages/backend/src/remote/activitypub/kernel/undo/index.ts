import { CacheableRemoteUser } from '@/models/entities/user.js';
import { IUndo, isFollow, isBlock, isLike, isAnnounce, getApType, isAccept } from '../../type.js';
import unfollow from './follow.js';
import unblock from './block.js';
import undoLike from './like.js';
import undoAccept from './accept.js';
import { undoAnnounce } from './announce.js';
import Resolver from '../../resolver.js';
import { apLogger } from '../../logger.js';

const logger = apLogger;

export default async (actor: CacheableRemoteUser, activity: IUndo): Promise<string> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	logger.info(`Undo: ${uri}`);

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isFollow(object)) return await unfollow(actor, object);
	if (isBlock(object)) return await unblock(actor, object);
	if (isLike(object)) return await undoLike(actor, object);
	if (isAnnounce(object)) return await undoAnnounce(actor, object);
	if (isAccept(object)) return await undoAccept(actor, object);

	return `skip: unknown object type ${getApType(object)}`;
};
