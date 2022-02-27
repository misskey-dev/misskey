import config from '@/config/index.js';
import { ILocalUser, IRemoteUser } from '@/models/entities/user.js';

export default (blocker: ILocalUser, blockee: IRemoteUser) => ({
	type: 'Block',
	actor: `${config.url}/users/${blocker.id}`,
	object: blockee.uri,
});
