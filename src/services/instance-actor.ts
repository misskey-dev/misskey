import { createSystemUser } from './create-system-user';
import { ILocalUser } from '../models/entities/user';
import { Users } from '../models';

const ACTOR_USERNAME = 'instance.actor' as const;

export async function getInstanceActor(): Promise<ILocalUser> {
	const user = await Users.findOne({
		host: null,
		username: ACTOR_USERNAME
	});

	if (user) return user as ILocalUser;

	const created = await createSystemUser(ACTOR_USERNAME);
	return created as ILocalUser;
}
