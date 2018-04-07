import { toUnicode, toASCII } from 'punycode';
import User from '../models/user';
import resolvePerson from './activitypub/resolve-person';
import Resolver from './activitypub/resolver';
import webFinger from './webfinger';

export default async (username, host, option) => {
	const usernameLower = username.toLowerCase();
	const hostLowerAscii = toASCII(host).toLowerCase();
	const hostLower = toUnicode(hostLowerAscii);

	let user = await User.findOne({ usernameLower, hostLower }, option);

	if (user === null) {
		const acctLower = `${usernameLower}@${hostLowerAscii}`;

		const finger = await webFinger(acctLower, acctLower);
		const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
		if (!self) {
			throw new Error('self link not found');
		}

		user = await resolvePerson(new Resolver(), self.href, acctLower);
	}

	return user;
};
