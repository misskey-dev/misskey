import config from '../../../config';
import { extractPublic } from '../../../crypto_key';
import { ILocalUser } from '../../../models/user';

export default (user: ILocalUser) => ({
	id: `${config.url}/users/${user.id}/publickey`,
	type: 'Key',
	owner: `${config.url}/users/${user.id}`,
	publicKeyPem: extractPublic(user.keypair)
});
