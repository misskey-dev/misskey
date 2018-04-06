import { JSDOM } from 'jsdom';
import { toUnicode } from 'punycode';
import parseAcct from '../../acct/parse';
import config from '../../config';
import User, { validateUsername, isValidName, isValidDescription } from '../../models/user';
import webFinger from '../webfinger';
import Resolver from './resolver';
import uploadFromUrl from '../../services/drive/upload-from-url';

export default async (value, verifier?: string) => {
	const id = value.id || value;
	const localPrefix = config.url + '/@';

	if (id.startsWith(localPrefix)) {
		return User.findOne(parseAcct(id.slice(localPrefix)));
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(value) as any;

	if (
		object == null ||
		object.type !== 'Person' ||
		typeof object.preferredUsername !== 'string' ||
		!validateUsername(object.preferredUsername) ||
		(object.name != '' && !isValidName(object.name)) ||
		!isValidDescription(object.summary)
	) {
		throw new Error('invalid person');
	}

	const finger = await webFinger(id, verifier);

	const host = toUnicode(finger.subject.replace(/^.*?@/, ''));
	const hostLower = host.replace(/[A-Z]+/, matched => matched.toLowerCase());
	const summaryDOM = JSDOM.fragment(object.summary);

	// Create user
	const user = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: Date.parse(object.published) || null,
		description: summaryDOM.textContent,
		followersCount: 0,
		followingCount: 0,
		name: object.name,
		postsCount: 0,
		driveCapacity: 1024 * 1024 * 8, // 8MiB
		username: object.preferredUsername,
		usernameLower: object.preferredUsername.toLowerCase(),
		host,
		hostLower,
		account: {
			publicKey: {
				id: object.publicKey.id,
				publicKeyPem: object.publicKey.publicKeyPem
			},
			inbox: object.inbox,
			uri: id,
		},
	});

	const [avatarId, bannerId] = await Promise.all([
		object.icon,
		object.image
	].map(async img => {
		if (img === undefined) {
			return null;
		}

		const file = await uploadFromUrl(img.url, user);

		return file._id;
	}));

	User.update({ _id: user._id }, { $set: { avatarId, bannerId } });

	user.avatarId = avatarId;
	user.bannerId = bannerId;

	return user;
};
