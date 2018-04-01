import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import { IPost, pack as packPost } from './post';
import Following from './following';
import Mute from './mute';
import getFriends from '../server/api/common/get-friends';
import config from '../conf';

const User = db.get<IUser>('users');

User.createIndex('username');
User.createIndex('account.token');

export default User;

export function validateUsername(username: string): boolean {
	return typeof username == 'string' && /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidName(name: string): boolean {
	return typeof name == 'string' && name.length < 30 && name.trim() != '';
}

export function isValidDescription(description: string): boolean {
	return typeof description == 'string' && description.length < 500 && description.trim() != '';
}

export function isValidLocation(location: string): boolean {
	return typeof location == 'string' && location.length < 50 && location.trim() != '';
}

export function isValidBirthday(birthday: string): boolean {
	return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}

export type ILocalAccount = {
	keypair: string;
	email: string;
	links: string[];
	password: string;
	token: string;
	twitter: {
		accessToken: string;
		accessTokenSecret: string;
		userId: string;
		screenName: string;
	};
	line: {
		userId: string;
	};
	profile: {
		location: string;
		birthday: string; // 'YYYY-MM-DD'
		tags: string[];
	};
	lastUsedAt: Date;
	isBot: boolean;
	isPro: boolean;
	twoFactorSecret: string;
	twoFactorEnabled: boolean;
	twoFactorTempSecret: string;
	clientSettings: any;
	settings: any;
};

export type IRemoteAccount = {
	uri: string;
};

export type IUser = {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	followersCount: number;
	followingCount: number;
	name: string;
	postsCount: number;
	driveCapacity: number;
	username: string;
	usernameLower: string;
	avatarId: mongo.ObjectID;
	bannerId: mongo.ObjectID;
	data: any;
	description: string;
	latestPost: IPost;
	pinnedPostId: mongo.ObjectID;
	isSuspended: boolean;
	keywords: string[];
	host: string;
	hostLower: string;
	account: ILocalAccount | IRemoteAccount;
};

export type ILocalUser = IUser & { account: ILocalAccount };
export type IRemoteUser = IUser & { account: IRemoteAccount };

export function init(user): IUser {
	user._id = new mongo.ObjectID(user._id);
	user.avatarId = new mongo.ObjectID(user.avatarId);
	user.bannerId = new mongo.ObjectID(user.bannerId);
	user.pinnedPostId = new mongo.ObjectID(user.pinnedPostId);
	return user;
}

/**
 * Pack a user for API response
 *
 * @param user target
 * @param me? serializee
 * @param options? serialize options
 * @return Packed user
 */
export const pack = (
	user: string | mongo.ObjectID | IUser,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail?: boolean,
		includeSecrets?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {

	const opts = Object.assign({
		detail: false,
		includeSecrets: false
	}, options);

	let _user: any;

	const fields = opts.detail ? {
	} : {
		'account.settings': false,
		'account.clientSettings': false,
		'account.profile': false,
		'account.keywords': false,
		'account.domains': false
	};

	// Populate the user if 'user' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(user)) {
		_user = await User.findOne({
			_id: user
		}, { fields });
	} else if (typeof user === 'string') {
		_user = await User.findOne({
			_id: new mongo.ObjectID(user)
		}, { fields });
	} else {
		_user = deepcopy(user);
	}

	if (!_user) return reject('invalid user arg.');

	// Me
	const meId: mongo.ObjectID = me
		? mongo.ObjectID.prototype.isPrototypeOf(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

	// Rename _id to id
	_user.id = _user._id;
	delete _user._id;

	// Remove needless properties
	delete _user.latestPost;

	if (!_user.host) {
		// Remove private properties
		delete _user.account.keypair;
		delete _user.account.password;
		delete _user.account.token;
		delete _user.account.twoFactorTempSecret;
		delete _user.account.twoFactorSecret;
		delete _user.usernameLower;
		if (_user.account.twitter) {
			delete _user.account.twitter.accessToken;
			delete _user.account.twitter.accessTokenSecret;
		}
		delete _user.account.line;

		// Visible via only the official client
		if (!opts.includeSecrets) {
			delete _user.account.email;
			delete _user.account.settings;
			delete _user.account.clientSettings;
		}

		if (!opts.detail) {
			delete _user.account.twoFactorEnabled;
		}
	}

	_user.avatarUrl = _user.avatarId != null
		? `${config.drive_url}/${_user.avatarId}`
		: `${config.drive_url}/default-avatar.jpg`;

	_user.bannerUrl = _user.bannerId != null
		? `${config.drive_url}/${_user.bannerId}`
		: null;

	if (!meId || !meId.equals(_user.id) || !opts.detail) {
		delete _user.avatarId;
		delete _user.bannerId;

		delete _user.driveCapacity;
	}

	if (meId && !meId.equals(_user.id)) {
		// Whether the user is following
		_user.isFollowing = (async () => {
			const follow = await Following.findOne({
				followerId: meId,
				followeeId: _user.id,
				deletedAt: { $exists: false }
			});
			return follow !== null;
		})();

		// Whether the user is followed
		_user.isFollowed = (async () => {
			const follow2 = await Following.findOne({
				followerId: _user.id,
				followeeId: meId,
				deletedAt: { $exists: false }
			});
			return follow2 !== null;
		})();

		// Whether the user is muted
		_user.isMuted = (async () => {
			const mute = await Mute.findOne({
				muterId: meId,
				muteeId: _user.id,
				deletedAt: { $exists: false }
			});
			return mute !== null;
		})();
	}

	if (opts.detail) {
		if (_user.pinnedPostId) {
			// Populate pinned post
			_user.pinnedPost = packPost(_user.pinnedPostId, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriends(meId);

			// Get following you know count
			_user.followingYouKnowCount = Following.count({
				followeeId: { $in: myFollowingIds },
				followerId: _user.id,
				deletedAt: { $exists: false }
			});

			// Get followers you know count
			_user.followersYouKnowCount = Following.count({
				followeeId: _user.id,
				followerId: { $in: myFollowingIds },
				deletedAt: { $exists: false }
			});
		}
	}

	// resolve promises in _user object
	_user = await rap(_user);

	resolve(_user);
});

/*
function img(url) {
	return {
		thumbnail: {
			large: `${url}`,
			medium: '',
			small: ''
		}
	};
}
*/
