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
		data: false
	} : {
		data: false,
		profile: false
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
	delete _user.lates_post;

	// Remove private properties
	delete _user.password;
	delete _user.token;
	delete _user.username_lower;
	if (_user.twitter) {
		delete _user.twitter.access_token;
		delete _user.twitter.access_token_secret;
	}

	// Visible via only the official client
	if (!opts.includeSecrets) {
		delete _user.data;
		delete _user.email;
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
		const follow = await Following.findOne({
			follower_id: meId,
			followee_id: _user.id,
			deleted_at: { $exists: false }
		});
		_user.is_following = follow !== null;

		// If the user is followed
		const follow2 = await Following.findOne({
			follower_id: _user.id,
			followee_id: meId,
			deleted_at: { $exists: false }
		});
		_user.is_followed = follow2 !== null;
	}

	if (opts.detail) {
		if (_user.pinned_post_id) {
			_user.pinned_post = await serializePost(_user.pinned_post_id, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriends(meId);

			// Get following you know count
			const followingYouKnowCount = await Following.count({
				followee_id: { $in: myFollowingIds },
				follower_id: _user.id,
				deleted_at: { $exists: false }
			});
			_user.following_you_know_count = followingYouKnowCount;

			// Get followers you know count
			const followersYouKnowCount = await Following.count({
				followee_id: _user.id,
				follower_id: { $in: myFollowingIds },
				deleted_at: { $exists: false }
			});
			_user.followers_you_know_count = followersYouKnowCount;
		}
	}

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
