/**
 * Module dependencies
 */
import $ from 'cafy';
import { JSDOM } from 'jsdom';
import { toUnicode, toASCII } from 'punycode';
import uploadFromUrl from '../../common/drive/upload_from_url';
import User, { pack, validateUsername, isValidName, isValidDescription } from '../../../../models/user';
const request = require('request-promise-native');
const WebFinger = require('webfinger.js');

const webFinger = new WebFinger({});

async function getCollectionCount(url) {
	if (!url) {
		return null;
	}

	try {
		const collection = await request({ url, json: true });
		return collection ? collection.totalItems : null;
	} catch (exception) {
		return null;
	}
}

function findUser(q) {
	return User.findOne(q, {
		fields: {
			data: false
		}
	});
}

function webFingerAndVerify(query, verifier) {
	return new Promise((res, rej) => webFinger.lookup(query, (error, result) => {
		if (error) {
			return rej(error);
		}

		if (result.object.subject.toLowerCase().replace(/^acct:/, '') !== verifier) {
			return rej('WebFinger verfification failed');
		}

		res(result.object);
	}));
}

/**
 * Show a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	let user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).optional.id().$;
	if (userIdErr) return rej('invalid userId param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	// Get 'host' parameter
	const [host, hostErr] = $(params.host).optional.string().$;
	if (hostErr) return rej('invalid host param');

	if (userId === undefined && typeof username !== 'string') {
		return rej('userId or pair of username and host is required');
	}

	// Lookup user
	if (typeof host === 'string') {
		const usernameLower = username.toLowerCase();
		const hostLowerAscii = toASCII(host).toLowerCase();
		const hostLower = toUnicode(hostLowerAscii);

		user = await findUser({ usernameLower, hostLower });

		if (user === null) {
			const acctLower = `${usernameLower}@${hostLowerAscii}`;
			let activityStreams;
			let finger;
			let followersCount;
			let followingCount;
			let postsCount;

			if (!validateUsername(username)) {
				return rej('username validation failed');
			}

			try {
				finger = await webFingerAndVerify(acctLower, acctLower);
			} catch (exception) {
				return rej('WebFinger lookup failed');
			}

			const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
			if (!self) {
				return rej('WebFinger has no reference to self representation');
			}

			try {
				activityStreams = await request({
					url: self.href,
					headers: {
						Accept: 'application/activity+json, application/ld+json'
					},
					json: true
				});
			} catch (exception) {
				return rej('failed to retrieve ActivityStreams representation');
			}

			if (!(activityStreams &&
				(Array.isArray(activityStreams['@context']) ?
					activityStreams['@context'].includes('https://www.w3.org/ns/activitystreams') :
					activityStreams['@context'] === 'https://www.w3.org/ns/activitystreams') &&
				activityStreams.type === 'Person' &&
				typeof activityStreams.preferredUsername === 'string' &&
				activityStreams.preferredUsername.toLowerCase() === usernameLower &&
				isValidName(activityStreams.name) &&
				isValidDescription(activityStreams.summary)
			)) {
				return rej('failed ActivityStreams validation');
			}

			try {
				[followersCount, followingCount, postsCount] = await Promise.all([
					getCollectionCount(activityStreams.followers),
					getCollectionCount(activityStreams.following),
					getCollectionCount(activityStreams.outbox),
					webFingerAndVerify(activityStreams.id, acctLower),
				]);
			} catch (exception) {
				return rej('failed to fetch assets');
			}

			const summaryDOM = JSDOM.fragment(activityStreams.summary);

			// Create user
			user = await User.insert({
				avatarId: null,
				bannerId: null,
				createdAt: new Date(),
				description: summaryDOM.textContent,
				followersCount,
				followingCount,
				name: activityStreams.name,
				postsCount,
				driveCapacity: 1024 * 1024 * 8, // 8MiB
				username,
				usernameLower,
				host: toUnicode(finger.subject.replace(/^.*?@/, '')),
				hostLower,
				account: {
					uri: activityStreams.id,
				},
			});

			const [icon, image] = await Promise.all([
				activityStreams.icon,
				activityStreams.image,
			].map(async image => {
				if (!image || image.type !== 'Image') {
					return { _id: null };
				}

				try {
					return await uploadFromUrl(image.url, user);
				} catch (exception) {
					return { _id: null };
				}
			}));

			User.update({ _id: user._id }, {
				$set: {
					avatarId: icon._id,
					bannerId: image._id,
				},
			});

			user.avatarId = icon._id;
			user.bannerId = icon._id;
		}
	} else {
		const q = userId !== undefined
			? { _id: userId }
			: { usernameLower: username.toLowerCase(), host: null };

		user = await findUser(q);

		if (user === null) {
			return rej('user not found');
		}
	}

	// Send response
	res(await pack(user, me, {
		detail: true
	}));
});
