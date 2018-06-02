import * as debug from 'debug';

import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import rejectFollow from './follow';
import { IReject } from '../../type';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity: IReject): Promise<void> => {
	const uri = activity.id || activity;

	log(`Reject: ${uri}`);

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
		rejectFollow(actor, object);
		break;

	default:
		console.warn(`Unknown reject type: ${object.type}`);
		break;
	}
};
