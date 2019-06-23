import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/entities/user';
import { performCreateDocument } from './document';
import createNote from './note';
import { ICreate, validDocument } from '../../type';
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

	if (validDocument.includes(object.type)) {
		performCreateDocument(actor, object);
	} else if (['Note', 'Question', 'Article'].includes(object.type)) {
		createNote(resolver, actor, object);
	} else {
		logger.warn(`Unknown type: ${object.type}`);
	}
};
