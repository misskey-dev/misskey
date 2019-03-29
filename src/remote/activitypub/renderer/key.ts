import config from '../../../config';
import { extractPublic } from '../../../crypto_key';
import { ILocalUser } from '../../../models/entities/user';
import { UserKeypair } from '../../../models/entities/user-keypair';

export default (user: ILocalUser, key: UserKeypair) => ({
	id: `${config.url}/users/${user.id}/publickey`,
	type: 'Key',
	owner: `${config.url}/users/${user.id}`,
	publicKeyPem: extractPublic(key.keyPem)
});
