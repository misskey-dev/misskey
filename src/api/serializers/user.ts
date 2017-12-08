/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { default as User, IUser } from '../models/user';
import serializePost from './post';
import Following from '../models/following';
import getFriends from '../common/get-friends';
import config from '../../conf';
import rap from '@prezzemolo/rap';

/**
 * Serialize a user
 *
 * @param user target
 * @param me? serializee
 * @param options? serialize options
 * @return response
 */
export default (
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
		settings: false
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
		// If the user is following
		_user.is_following = (async () => {
			const follow = await Following.findOne({
				follower_id: meId,
				followee_id: _user.id,
				deleted_at: { $exists: false }
			});
			return follow !== null;
		})();

		// If the user is followed
		_user.is_followed = (async () => {
			const follow2 = await Following.findOne({
				follower_id: _user.id,
				followee_id: meId,
				deleted_at: { $exists: false }
			});
			return follow2 !== null;
		})();
	}

	if (opts.detail) {
		if (_user.pinned_post_id) {
			// Populate pinned post
			_user.pinned_post = serializePost(_user.pinned_post_id, meId, {
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
