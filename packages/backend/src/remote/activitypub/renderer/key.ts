import config from '@/config/index';
import { ILocalUser } from '@/models/entities/user';
import { UserKeypair } from '@/models/entities/user-keypair';
import { createPublicKey } from 'crypto';

export default (user: ILocalUser, key: UserKeypair, postfix?: string) => ({
	id: `${config.url}/users/${user.id}${postfix || '/publickey'}`,
	type: 'Key',
	owner: `${config.url}/users/${user.id}`,
	publicKeyPem: createPublicKey(key.publicKey).export({
		type: 'spki',
		format: 'pem',
	}),
});
