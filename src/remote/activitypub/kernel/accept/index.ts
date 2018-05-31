import * as debug from 'debug';

import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import acceptFollow from './follow';
import { IAccept } from '../../type';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity: IAccept): Promise<void> => {
	const uri = activity.id || activity;

	log(`Accept: ${uri}`);

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
	acceptFollow(resolver, actor, activity, object);
		break;

	default:
		console.warn(`Unknown accept type: ${object.type}`);
		break;
	}
};
