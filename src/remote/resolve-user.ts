import { toUnicode, toASCII } from 'punycode';
import User, { IUser } from '../models/user';
import webFinger from './webfinger';
import config from '../config';
import { createPerson } from './activitypub/models/person';

export default async (username, _host, option?): Promise<IUser> => {
	const usernameLower = username.toLowerCase();

	if (_host == null) {
		return await User.findOne({ usernameLower });
	}

	const hostAscii = toASCII(_host).toLowerCase();
	const host = toUnicode(hostAscii);

	if (config.host == host) {
		return await User.findOne({ usernameLower });
	}

	let user = await User.findOne({ usernameLower, host }, option);

	if (user === null) {
		const acctLower = `${usernameLower}@${hostAscii}`;

		const finger = await webFinger(acctLower);
		const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
		if (!self) {
			throw new Error('self link not found');
		}

		user = await createPerson(self.href);
	}

	return user;
};
