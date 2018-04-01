import config from '../../../../conf';
import { extractPublic } from '../../../../crypto_key';
import { ILocalAccount } from '../../../../models/user';

export default ({ username, account }) => ({
	id: `${config.url}/@${username}/publickey`,
	type: 'Key',
	owner: `${config.url}/@${username}`,
	publicKeyPem: extractPublic((account as ILocalAccount).keypair)
});
