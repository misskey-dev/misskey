import { IRemoteUser } from '@/models/entities/user';
import { IUndo, isFollow, isBlock, isLike, isAnnounce, getApType } from '../../type';
import unfollow from './follow';
import unblock from './block';
import undoLike from './like';
import { undoAnnounce } from './announce';
import Resolver from '../../resolver';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IUndo): Promise<string> => {
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

	return `skip: unknown object type ${getApType(object)}`;
};
