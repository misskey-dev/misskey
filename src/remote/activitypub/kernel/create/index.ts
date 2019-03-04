import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import createImage from './image';
import createNote from './note';
import { ICreate } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: ICreate): Promise<void> => {
	const uri = activity.id || activity;

	logger.info(`Create: ${uri}`);

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	}

	switch (object.type) {
	case 'Image':
		createImage(actor, object);
		break;

	case 'Note':
		createNote(resolver, actor, object);
		break;

	case 'Question':
		createNote(resolver, actor, object);
		break;

	default:
		logger.warn(`Unknown type: ${object.type}`);
		break;
	}
};
