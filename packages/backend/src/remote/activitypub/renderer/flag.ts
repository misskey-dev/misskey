import config from '@/config/index';
import { IObject, IActivity } from '@/remote/activitypub/type';
import { ILocalUser, IRemoteUser } from '@/models/entities/user';
import { getInstanceActor } from '@/services/instance-actor';

// to anonymise reporters, the reporting actor must be a system user
// object has to be a uri or array of uris
export const renderFlag = (user: ILocalUser, object: [string], content: string): IActivity => {
	return {
		type: 'Flag',
		actor: `${config.url}/users/${user.id}`,
		content,
		object,
	};
};
