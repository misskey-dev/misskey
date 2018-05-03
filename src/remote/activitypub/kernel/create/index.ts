import * as debug from 'debug';

import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import createNote from './note';
import createImage from './image';
import { ICreate } from '../../type';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity: ICreate): Promise<void> => {
	const uri = activity.id || activity;

	log(`Create: ${uri}`);

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		log(`Resolution failed: ${e}`);
		throw e;
	}

	switch (object.type) {
	case 'Image':
		createImage(actor, object);
		break;

	case 'Note':
		createNote(resolver, actor, object);
		break;

	default:
		console.warn(`Unknown type: ${object.type}`);
		break;
	}
};
