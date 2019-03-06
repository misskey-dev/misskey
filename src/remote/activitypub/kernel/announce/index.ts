import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import announceNote from './note';
import { IAnnounce, INote } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IAnnounce): Promise<void> => {
	const uri = activity.id || activity;

	logger.info(`Announce: ${uri}`);

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	}

	switch (object.type) {
	case 'Note':
		announceNote(resolver, actor, activity, object as INote);
		break;

	case 'Question':
		announceNote(resolver, actor, activity, object as INote);
		break;

	default:
		logger.warn(`Unknown announce type: ${object.type}`);
		break;
	}
};
