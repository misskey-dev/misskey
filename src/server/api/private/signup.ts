import * as uuid from 'uuid';
import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import { generate as generateKeypair } from '../../../crypto_key';
import recaptcha = require('recaptcha-promise');
import User, { IUser, validateUsername, validatePassword, pack } from '../../../models/user';
import generateUserToken from '../common/generate-native-user-token';
import config from '../../../config';

recaptcha.init({
	secret_key: config.recaptcha.secret_key
});

const home = {
	left: [
		'profile',
		'calendar',
		'activity',
		'rss',
		'trends',
		'photo-stream',
		'version'
	],
	right: [
		'broadcast',
		'notifications',
		'users',
		'polls',
		'server',
		'donation',
		'nav',
		'tips'
	]
};

export default async (req: express.Request, res: express.Response) => {
	// Verify recaptcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test') {
		const success = await recaptcha(req.body['g-recaptcha-response']);

		if (!success) {
			res.status(400).send('recaptcha-failed');
			return;
		}
	}

	const username = req.body['username'];
	const password = req.body['password'];

	// Validate username
	if (!validateUsername(username)) {
		res.sendStatus(400);
		return;
	}

	// Validate password
	if (!validatePassword(password)) {
		res.sendStatus(400);
		return;
	}

	// Fetch exist user that same username
	const usernameExist = await User
		.count({
			usernameLower: username.toLowerCase(),
			host: null
		}, {
			limit: 1
		});

	// Check username already used
	if (usernameExist !== 0) {
		res.sendStatus(400);
		return;
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(password, salt);

	// Generate secret
	const secret = generateUserToken();

	//#region Construct home data
	const homeData = [];

	home.left.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'left',
			data: {}
		});
	});

	home.right.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'right',
			data: {}
		});
	});
	//#endregion

	// Create account
	const account: IUser = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: new Date(),
		description: null,
		followersCount: 0,
		followingCount: 0,
		name: null,
		postsCount: 0,
		driveCapacity: 1024 * 1024 * 128, // 128MiB
		username: username,
		usernameLower: username.toLowerCase(),
		host: null,
		hostLower: null,
		account: {
			keypair: generateKeypair(),
			token: secret,
			email: null,
			links: null,
			password: hash,
			profile: {
				bio: null,
				birthday: null,
				blood: null,
				gender: null,
				handedness: null,
				height: null,
				location: null,
				weight: null
			},
			settings: {
				autoWatch: true
			},
			clientSettings: {
				home: homeData
			}
		}
	});

	// Response
	res.send(await pack(account));

	// Create search index
	if (config.elasticsearch.enable) {
		const es = require('../../db/elasticsearch');
		es.index({
			index: 'misskey',
			type: 'user',
			id: account._id.toString(),
			body: {
				username: username
			}
		});
	}
};
