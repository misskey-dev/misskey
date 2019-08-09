import Resolver from '~/remote/activitypub/resolver';
import { IRemoteUser } from '~/models/entities/user';
import acceptFollow from './follow';
import { IAccept, IFollow } from '~/remote/activitypub/type';
import { apLogger } from '~/remote/activitypub/logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IAccept): Promise<void> => {
	const uri = activity.id || activity;

	logger.info(`Accept: ${uri}`);

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	}

	switch (object.type) {
	case 'Follow':
		acceptFollow(actor, object as IFollow);
		break;

	default:
		logger.warn(`Unknown accept type: ${object.type}`);
		break;
	}
};
