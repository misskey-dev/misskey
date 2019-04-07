import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';
import { UserKeypair } from '../../../models/entities/user-keypair';

export default (user: ILocalUser, key: UserKeypair) => ({
	id: `${config.url}/users/${user.id}/publickey`,
	type: 'Key',
	owner: `${config.url}/users/${user.id}`,
	publicKeyPem: key.publicKey
});
