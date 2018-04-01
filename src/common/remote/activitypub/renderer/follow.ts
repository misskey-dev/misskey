import config from '../../../../conf';
import { IRemoteAccount } from '../../../../models/user';

export default ({ username }, { account }) => ({
	type: 'Follow',
	actor: `${config.url}/@${username}`,
	object: (account as IRemoteAccount).uri
});
