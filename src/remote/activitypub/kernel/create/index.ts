import Resolver from '../../resolver';
import { IRemoteUser } from '@/models/entities/user';
import createNote from './note';
import { ICreate, getApId, isPost, getApType } from '../../type';
import { apLogger } from '../../logger';
import { toArray, concat, unique } from '@/prelude/array';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: ICreate): Promise<void> => {
	const uri = getApId(activity);

	logger.info(`Create: ${uri}`);

	// copy audiences between activity <=> object.
	if (typeof activity.object === 'object') {
		const to = unique(concat([toArray(activity.to), toArray(activity.object.to)]));
		const cc = unique(concat([toArray(activity.cc), toArray(activity.object.cc)]));

		activity.to = to;
		activity.cc = cc;
		activity.object.to = to;
		activity.object.cc = cc;
	}

	// If there is no attributedTo, use Activity actor.
	if (typeof activity.object === 'object' && !activity.object.attributedTo) {
		activity.object.attributedTo = activity.actor;
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isPost(object)) {
		createNote(resolver, actor, object, false, activity);
	} else {
		logger.warn(`Unknown type: ${getApType(object)}`);
	}
};
