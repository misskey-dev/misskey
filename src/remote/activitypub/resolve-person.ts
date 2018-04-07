import { JSDOM } from 'jsdom';
import { toUnicode } from 'punycode';
import parseAcct from '../../acct/parse';
import config from '../../config';
import User, { validateUsername, isValidName, isValidDescription } from '../../models/user';
import webFinger from '../webfinger';
import Resolver from './resolver';
import uploadFromUrl from '../../services/drive/upload-from-url';
import { isCollectionOrOrderedCollection } from './type';

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
		!isValidName(object.name == '' ? null : object.name) ||
		!isValidDescription(object.summary)
	) {
		throw new Error('invalid person');
	}

	const [followersCount = 0, followingCount = 0, notesCount = 0, finger] = await Promise.all([
		resolver.resolve(object.followers).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(object.following).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(object.outbox).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		webFinger(id, verifier)
	]);

	const host = toUnicode(finger.subject.replace(/^.*?@/, ''));
	const hostLower = host.replace(/[A-Z]+/, matched => matched.toLowerCase());
	const summaryDOM = JSDOM.fragment(object.summary);

	// Create user
	const user = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: Date.parse(object.published) || null,
		description: summaryDOM.textContent,
		followersCount,
		followingCount,
		notesCount,
		name: object.name,
		driveCapacity: 1024 * 1024 * 8, // 8MiB
		username: object.preferredUsername,
		usernameLower: object.preferredUsername.toLowerCase(),
		host,
		hostLower,
		publicKey: {
			id: object.publicKey.id,
			publicKeyPem: object.publicKey.publicKeyPem
		},
		inbox: object.inbox,
		uri: id
	});

	const [avatarId, bannerId] = (await Promise.all([
		object.icon,
		object.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: uploadFromUrl(img.url, user)
	))).map(file => file != null ? file._id : null);

	User.update({ _id: user._id }, { $set: { avatarId, bannerId } });

	user.avatarId = avatarId;
	user.bannerId = bannerId;

	return user;
};
