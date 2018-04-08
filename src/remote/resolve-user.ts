import { toUnicode, toASCII } from 'punycode';
import User from '../models/user';
import webFinger from './webfinger';
import config from '../config';
import { createPerson } from './activitypub/objects/person';

export default async (username, host, option) => {
	const usernameLower = username.toLowerCase();
	const hostLowerAscii = toASCII(host).toLowerCase();
	const hostLower = toUnicode(hostLowerAscii);

	if (config.host == hostLower) {
		return await User.findOne({ usernameLower });
	}

	let user = await User.findOne({ usernameLower, hostLower }, option);

	if (user === null) {
		const acctLower = `${usernameLower}@${hostLowerAscii}`;

		const finger = await webFinger(acctLower);
		const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
		if (!self) {
			throw new Error('self link not found');
		}

		user = await createPerson(self.href);
	}

	return user;
};
