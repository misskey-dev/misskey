import config from '@/config/index.js';
import { IObject, IActivity } from '@/remote/activitypub/type.js';
import { ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import { getInstanceActor } from '@/services/instance-actor.js';

// to anonymise reporters, the reporting actor must be a system user
// object has to be a uri or array of uris
export const renderFlag = (user: ILocalUser, object: [string], content: string) => {
	return {
		type: 'Flag',
		actor: `${config.url}/users/${user.id}`,
		content,
		object,
	};
};
