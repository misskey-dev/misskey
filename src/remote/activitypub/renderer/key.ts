import config from '../../../config';
import { extractPublic } from '../../../crypto_key';
import { ILocalUser } from '../../../models/user';

export default (user: ILocalUser) => ({
	id: `${config.url}/@${user.username}/publickey`,
	type: 'Key',
	owner: `${config.url}/@${user.username}`,
	publicKeyPem: extractPublic(user.keypair)
});
