import * as debug from 'debug';

import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import createNote from './note';
import createImage from './image';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	log(`Create: ${uri}`);

	// TODO: 同じURIをもつものが既に登録されていないかチェック

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
		createImage(resolver, actor, object);
		break;

	case 'Note':
		createNote(resolver, actor, object);
		break;

	default:
		console.warn(`Unknown type: ${object.type}`);
		break;
	}
};
