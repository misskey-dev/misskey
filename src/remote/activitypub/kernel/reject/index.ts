import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/entities/user';
import rejectFollow from './follow';
import { IReject, IFollow } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IReject): Promise<void> => {
	const uri = activity.id || activity;

	logger.info(`Reject: ${uri}`);

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	switch (object.type) {
	case 'Follow':
		rejectFollow(actor, object as IFollow);
		break;

	default:
		logger.warn(`Unknown reject type: ${object.type}`);
		break;
	}
};
