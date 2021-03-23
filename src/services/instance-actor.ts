import { createSystemUser } from './create-system-user';
import { ILocalUser } from '../models/entities/user';
import { Users } from '../models';
import { Cache } from '@/misc/cache';

const ACTOR_USERNAME = 'instance.actor' as const;

const cache = new Cache<ILocalUser>(Infinity);

export async function getInstanceActor(): Promise<ILocalUser> {
	const cached = cache.get(null);
	if (cached) return cached;

	const user = await Users.findOne({
		host: null,
		username: ACTOR_USERNAME
	}) as ILocalUser | undefined;

	if (user) {
		cache.set(null, user);
		return user;
	} else {
		const created = await createSystemUser(ACTOR_USERNAME) as ILocalUser;
		cache.set(null, created);
		return created;
	}
}
