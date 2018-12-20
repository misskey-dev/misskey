import config from '../../../config';
import { ILocalUser, IRemoteUser } from '../../../models/user';

export default (blocker?: ILocalUser, blockee?: IRemoteUser) => ({
	type: 'Block',
	actor: `${config.url}/users/${blocker._id}`,
	object: blockee.uri
});
