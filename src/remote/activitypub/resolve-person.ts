import { JSDOM } from 'jsdom';
import { toUnicode } from 'punycode';
import User, { validateUsername, isValidName, isValidDescription } from '../../models/user';
import { createHttp } from '../../queue';
import webFinger from '../webfinger';
import create from './create';

async function isCollection(collection) {
	return ['Collection', 'OrderedCollection'].includes(collection.type);
}

export default async (parentResolver, value, verifier?: string) => {
	const { resolver, object } = parentResolver.resolveOne(value);

	if (
		object === null ||
		object.type !== 'Person' ||
		typeof object.preferredUsername !== 'string' ||
		!validateUsername(object.preferredUsername) ||
		!isValidName(object.name) ||
		!isValidDescription(object.summary)
	) {
		throw new Error();
	}

	const [followers, following, outbox, finger] = await Promise.all([
		resolver.resolveOne(object.followers).then(
			resolved => isCollection(resolved.object) ? resolved.object : null,
			() => null
		),
		resolver.resolveOne(object.following).then(
			resolved => isCollection(resolved.object) ? resolved.object : null,
			() => null
		),
		resolver.resolveOne(object.outbox).then(
			resolved => isCollection(resolved.object) ? resolved.object : null,
			() => null
		),
		webFinger(object.id, verifier),
	]);

	const host = toUnicode(finger.subject.replace(/^.*?@/, ''));
	const hostLower = host.replace(/[A-Z]+/, matched => matched.toLowerCase());
	const summaryDOM = JSDOM.fragment(object.summary);

	// Create user
	const user = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: Date.parse(object.published),
		description: summaryDOM.textContent,
		followersCount: followers ? followers.totalItem || 0 : 0,
		followingCount: following ? following.totalItem || 0 : 0,
		name: object.name,
		postsCount: outbox ? outbox.totalItem || 0 : 0,
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
			uri: object.id,
		},
	});

	createHttp({
		type: 'performActivityPub',
		actor: user._id,
		outbox
	}).save();

	const [avatarId, bannerId] = await Promise.all([
		object.icon,
		object.image
	].map(async value => {
		if (value === undefined) {
			return null;
		}

		try {
			const created = await create(resolver, user, value);

			await Promise.all(created.map(asyncCreated => asyncCreated.then(created => {
				if (created !== null && created.object.$ref === 'driveFiles.files') {
					throw created.object.$id;
				}
			}, () => {})));

			return null;
		} catch (id) {
			return id;
		}
	}));

	User.update({ _id: user._id }, { $set: { avatarId, bannerId } });

	user.avatarId = avatarId;
	user.bannerId = bannerId;

	return user;
};
