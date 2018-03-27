/**
 * Module dependencies
 */
import $ from 'cafy';
import { JSDOM } from 'jsdom';
import { toUnicode, toASCII } from 'punycode';
import uploadFromUrl from '../../common/drive/upload_from_url';
import User, { pack, validateUsername, isValidName, isValidDescription } from '../../models/user';
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

	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).optional.id().$;
	if (userIdErr) return rej('invalid user_id param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	// Get 'host' parameter
	const [host, hostErr] = $(params.host).optional.string().$;
	if (hostErr) return rej('invalid username param');

	if (userId === undefined && typeof username !== 'string') {
		return rej('user_id or pair of username and host is required');
	}

	// Lookup user
	if (typeof host === 'string') {
		const username_lower = username.toLowerCase();
		const host_lower_ascii = toASCII(host).toLowerCase();
		const host_lower = toUnicode(host_lower_ascii);

		user = await findUser({ username_lower, host_lower });

		if (user === null) {
			const acct_lower = `${username_lower}@${host_lower_ascii}`;
			let activityStreams;
			let finger;
			let followers_count;
			let following_count;
			let likes_count;
			let posts_count;

			if (!validateUsername(username)) {
				return rej('username validation failed');
			}

			try {
				finger = await webFingerAndVerify(acct_lower, acct_lower);
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
				activityStreams.preferredUsername.toLowerCase() === username_lower &&
				isValidName(activityStreams.name) &&
				isValidDescription(activityStreams.summary)
			)) {
				return rej('failed ActivityStreams validation');
			}

			try {
				[followers_count, following_count, likes_count, posts_count] = await Promise.all([
					getCollectionCount(activityStreams.followers),
					getCollectionCount(activityStreams.following),
					getCollectionCount(activityStreams.liked),
					getCollectionCount(activityStreams.outbox),
					webFingerAndVerify(activityStreams.id, acct_lower),
				]);
			} catch (exception) {
				return rej('failed to fetch assets');
			}

			const summaryDOM = JSDOM.fragment(activityStreams.summary);

			// Create user
			user = await User.insert({
				avatar_id: null,
				banner_id: null,
				created_at: new Date(),
				description: summaryDOM.textContent,
				followers_count,
				following_count,
				name: activityStreams.name,
				posts_count,
				likes_count,
				liked_count: 0,
				drive_capacity: 1073741824, // 1GB
				username: username,
				username_lower,
				host: toUnicode(finger.subject.replace(/^.*?@/, '')),
				host_lower,
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
					avatar_id: icon._id,
					banner_id: image._id,
				},
			});

			user.avatar_id = icon._id;
			user.banner_id = icon._id;
		}
	} else {
		const q = userId !== undefined
			? { _id: userId }
			: { username_lower: username.toLowerCase(), host: null };

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
