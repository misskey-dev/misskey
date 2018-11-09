import { toUnicode, toASCII } from 'punycode';
import User, { IUser, IRemoteUser } from '../models/user';
import webFinger from './webfinger';
import config from '../config';
import { createPerson, updatePerson } from './activitypub/models/person';
import { URL } from 'url';
import * as debug from 'debug';

const log = debug('misskey:remote:resolve-user');

export default async (username: string, _host: string, option?: any, resync?: boolean): Promise<IUser> => {
	const usernameLower = username.toLowerCase();

	if (_host == null) {
		log(`return local user: ${usernameLower}`);
		return await User.findOne({ usernameLower, host: null });
	}

	const hostAscii = toASCII(_host).toLowerCase();
	const host = toUnicode(hostAscii);

	if (config.host == host) {
		log(`return local user: ${usernameLower}`);
		return await User.findOne({ usernameLower, host: null });
	}

	const user = await User.findOne({ usernameLower, host }, option);

	const acctLower = `${usernameLower}@${hostAscii}`;

	if (user === null) {
		const self = await resolveSelf(acctLower);

		log(`return new remote user: ${acctLower}`);
		return await createPerson(self.href);
	}

	if (resync) {
		log(`try resync: ${acctLower}`);
		const self = await resolveSelf(acctLower);

		if ((user as IRemoteUser).uri !== self.href) {
			// if uri mismatch, Fix (user@host <=> AP's Person id(IRemoteUser.uri)) mapping.
			log(`uri missmatch: ${acctLower}`);
			console.log(`recovery missmatch uri for (username=${username}, host=${host}) from ${(user as IRemoteUser).uri} to ${self.href}`);

			// validate uri
			const uri = new URL(self.href);
			if (uri.hostname !== hostAscii) {
				throw new Error(`Invalied uri`);
			}

			await User.update({
				usernameLower,
				host: host
			 }, {
				$set: {
					uri: self.href
				}
			});
		} else {
			log(`uri is fine: ${acctLower}`);
		}

		await updatePerson(self.href);

		log(`return resynced remote user: ${acctLower}`);
		return await User.findOne({ uri: self.href });
}

	log(`return existing remote user: ${acctLower}`);
	return user;
};

async function resolveSelf(acctLower: string) {
	log(`WebFinger for ${acctLower}`);
	const finger = await webFinger(acctLower);
	const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
	if (!self) {
		throw new Error('self link not found');
	}
	return self;
}
