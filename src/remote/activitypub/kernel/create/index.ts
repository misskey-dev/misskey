import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/entities/user';
import createNote from './note';
import { ICreate, getApId, validPost } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: ICreate): Promise<void> => {
	const uri = getApId(activity);

	logger.info(`Create: ${uri}`);

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (validPost.includes(object.type)) {
		createNote(resolver, actor, object);
	} else {
		logger.warn(`Unknown type: ${object.type}`);
	}
};
