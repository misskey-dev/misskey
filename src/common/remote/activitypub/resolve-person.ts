import { JSDOM } from 'jsdom';
import { toUnicode } from 'punycode';
import User, { validateUsername, isValidName, isValidDescription } from '../../../models/user';
import queue from '../../../queue';
import webFinger from '../webfinger';
import create from './create';
import Resolver from './resolver';

async function isCollection(collection) {
	return ['Collection', 'OrderedCollection'].includes(collection.type);
}

export default async (value, usernameLower, hostLower, acctLower) => {
	if (!validateUsername(usernameLower)) {
		throw new Error;
	}

	const { resolver, object } = await (new Resolver).resolveOne(value);

	if (
		object === null ||
		object.type !== 'Person' ||
		typeof object.preferredUsername !== 'string' ||
		object.preferredUsername.toLowerCase() !== usernameLower ||
		!isValidName(object.name) ||
		!isValidDescription(object.summary)
	) {
		throw new Error;
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
		webFinger(object.id, acctLower),
	]);

	const summaryDOM = JSDOM.fragment(object.summary);

	// Create user
	const user = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: Date.parse(object.published),
		description: summaryDOM.textContent,
		followersCount: followers.totalItem,
		followingCount: following.totalItem,
		name: object.name,
		postsCount: outbox.totalItem,
		driveCapacity: 1024 * 1024 * 8, // 8MiB
		username: object.preferredUsername,
		usernameLower,
		host: toUnicode(finger.subject.replace(/^.*?@/, '')),
		hostLower,
		account: {
			publicKey: {
				id: object.publicKey.id,
				publicKeyPem: object.publicKey.publicKeyPem
			},
			uri: object.id,
		},
	});

	queue.create('http', {
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
