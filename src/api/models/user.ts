import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../../db/mongodb';
import { IPost, pack as packPost } from './post';
import Following from './following';
import Mute from './mute';
import getFriends from '../common/get-friends';
import config from '../../conf';

const User = db.get<IUser>('users');

User.createIndex('username');
User.createIndex('token');

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

export type IUser = {
	_id: mongo.ObjectID;
	created_at: Date;
	deleted_at: Date;
	email: string;
	followers_count: number;
	following_count: number;
	links: string[];
	name: string;
	password: string;
	posts_count: number;
	drive_capacity: number;
	username: string;
	username_lower: string;
	token: string;
	avatar_id: mongo.ObjectID;
	banner_id: mongo.ObjectID;
	data: any;
	twitter: {
		access_token: string;
		access_token_secret: string;
		user_id: string;
		screen_name: string;
	};
	line: {
		user_id: string;
	};
	description: string;
	profile: {
		location: string;
		birthday: string; // 'YYYY-MM-DD'
		tags: string[];
	};
	last_used_at: Date;
	latest_post: IPost;
	pinned_post_id: mongo.ObjectID;
	is_bot: boolean;
	is_pro: boolean;
	is_suspended: boolean;
	keywords: string[];
	two_factor_secret: string;
	two_factor_enabled: boolean;
	client_settings: any;
	settings: any;
};

export function init(user): IUser {
	user._id = new mongo.ObjectID(user._id);
	user.avatar_id = new mongo.ObjectID(user.avatar_id);
	user.banner_id = new mongo.ObjectID(user.banner_id);
	user.pinned_post_id = new mongo.ObjectID(user.pinned_post_id);
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
		settings: false,
		client_settings: false,
		profile: false,
		keywords: false,
		domains: false
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
	delete _user.latest_post;

	// Remove private properties
	delete _user.password;
	delete _user.token;
	delete _user.two_factor_temp_secret;
	delete _user.two_factor_secret;
	delete _user.username_lower;
	if (_user.twitter) {
		delete _user.twitter.access_token;
		delete _user.twitter.access_token_secret;
	}
	delete _user.line;

	// Visible via only the official client
	if (!opts.includeSecrets) {
		delete _user.email;
		delete _user.settings;
		delete _user.client_settings;
	}

	if (!opts.detail) {
		delete _user.two_factor_enabled;
	}

	_user.avatar_url = _user.avatar_id != null
		? `${config.drive_url}/${_user.avatar_id}`
		: `${config.drive_url}/default-avatar.jpg`;

	_user.banner_url = _user.banner_id != null
		? `${config.drive_url}/${_user.banner_id}`
		: null;

	if (!meId || !meId.equals(_user.id) || !opts.detail) {
		delete _user.avatar_id;
		delete _user.banner_id;

		delete _user.drive_capacity;
	}

	if (meId && !meId.equals(_user.id)) {
		// Whether the user is following
		_user.is_following = (async () => {
			const follow = await Following.findOne({
				follower_id: meId,
				followee_id: _user.id,
				deleted_at: { $exists: false }
			});
			return follow !== null;
		})();

		// Whether the user is followed
		_user.is_followed = (async () => {
			const follow2 = await Following.findOne({
				follower_id: _user.id,
				followee_id: meId,
				deleted_at: { $exists: false }
			});
			return follow2 !== null;
		})();

		// Whether the user is muted
		_user.is_muted = (async () => {
			const mute = await Mute.findOne({
				muter_id: meId,
				mutee_id: _user.id,
				deleted_at: { $exists: false }
			});
			return mute !== null;
		})();
	}

	if (opts.detail) {
		if (_user.pinned_post_id) {
			// Populate pinned post
			_user.pinned_post = packPost(_user.pinned_post_id, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriends(meId);

			// Get following you know count
			_user.following_you_know_count = Following.count({
				followee_id: { $in: myFollowingIds },
				follower_id: _user.id,
				deleted_at: { $exists: false }
			});

			// Get followers you know count
			_user.followers_you_know_count = Following.count({
				followee_id: _user.id,
				follower_id: { $in: myFollowingIds },
				deleted_at: { $exists: false }
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
