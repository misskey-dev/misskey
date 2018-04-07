import * as debug from 'debug';

import { IRemoteUser } from '../../../../models/user';
import { IUndo } from '../../type';
import unfollow from './follow';
import Resolver from '../../resolver';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity: IUndo): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	log(`Undo: ${uri}`);

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		log(`Resolution failed: ${e}`);
		throw e;
	}

	switch (object.type) {
		case 'Follow':
			unfollow(actor, object);
			break;
	}

	return null;
};
