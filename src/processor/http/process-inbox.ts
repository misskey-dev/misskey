import { verifySignature } from 'http-signature';
import parseAcct from '../../acct/parse';
import User, { IRemoteUser } from '../../models/user';
import act from '../../remote/activitypub/act';
import resolvePerson from '../../remote/activitypub/resolve-person';

export default async ({ data }) => {
	const keyIdLower = data.signature.keyId.toLowerCase();
	let user;

	if (keyIdLower.startsWith('acct:')) {
		const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
		if (host === null) {
			throw 'request was made by local user';
		}

		user = await User.findOne({ usernameLower: username, hostLower: host }) as IRemoteUser;
	} else {
		user = await User.findOne({
			host: { $ne: null },
			'account.publicKey.id': data.signature.keyId
		}) as IRemoteUser;

		if (user === null) {
			user = await resolvePerson(data.signature.keyId);
		}
	}

	if (user === null) {
		throw 'failed to resolve user';
	}

	if (!verifySignature(data.signature, user.account.publicKey.publicKeyPem)) {
		throw 'signature verification failed';
	}

	await act(user, data.inbox, true);
};
