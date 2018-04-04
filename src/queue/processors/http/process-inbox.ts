import { verifySignature } from 'http-signature';
import parseAcct from '../../../acct/parse';
import User, { IRemoteUser } from '../../../models/user';
import act from '../../../remote/activitypub/act';
import resolvePerson from '../../../remote/activitypub/resolve-person';
import Resolver from '../../../remote/activitypub/resolver';

export default async ({ data }, done) => {
	try {
		const keyIdLower = data.signature.keyId.toLowerCase();
		let user;

		if (keyIdLower.startsWith('acct:')) {
			const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
			if (host === null) {
				done();
				return;
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

		if (user === null || !verifySignature(data.signature, user.account.publicKey.publicKeyPem)) {
			done();
			return;
		}

		await Promise.all(await act(new Resolver(), user, data.inbox, true));
	} catch (error) {
		done(error);
		return;
	}

	done();
};
