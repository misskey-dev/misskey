import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/entities/user';
import acceptFollow from './follow';
import { IAccept, IFollow } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IAccept): Promise<void> => {
	const uri = activity.id || activity;

	logger.info(`Accept: ${uri}`);

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	switch (object.type) {
	case 'Follow':
		acceptFollow(actor, object as IFollow);
		break;

	default:
		logger.warn(`Unknown accept type: ${object.type}`);
		break;
	}
};
