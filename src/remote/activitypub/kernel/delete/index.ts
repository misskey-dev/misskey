import Resolver from '../../resolver';
import deleteNote from './note';
import Note from '../../../../models/note';
import { IRemoteUser } from '../../../../models/user';
import { IDelete } from '../../type';
import { apLogger } from '../../logger';

/**
 * 削除アクティビティを捌きます
 */
export default async (actor: IRemoteUser, activity: IDelete): Promise<void> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object);

	const uri = (object as any).id;

	switch (object.type) {
	case 'Note':
		deleteNote(actor, uri);
		break;

	case 'Question':
		deleteNote(actor, uri);
		break;

	case 'Tombstone':
		const note = await Note.findOne({ uri });
		if (note != null) {
			deleteNote(actor, uri);
		}
		break;

	default:
		apLogger.warn(`Unknown type: ${object.type}`);
		break;
	}
};
