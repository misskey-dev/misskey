import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import Note, { INote, pack as packNote, physicalDelete as physicalDeleteNote } from './note';
import Following from './following';
import Mute from './mute';
import getFriends from '../server/api/common/get-friends';
import config from '../config';

const User = db.get<IUser>('users');

User.createIndex('username');
User.createIndex('token');
User.createIndex('uri', { sparse: true, unique: true });

export default User;

type IUserBase = {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	followersCount: number;
	followingCount: number;
	name?: string;
	notesCount: number;
	driveCapacity: number;
	username: string;
	usernameLower: string;
	avatarId: mongo.ObjectID;
	bannerId: mongo.ObjectID;
	data: any;
	description: string;
	latestNote: INote;
	pinnedNoteId: mongo.ObjectID;
	isSuspended: boolean;
	keywords: string[];
	host: string;
	hostLower: string;
};

export interface ILocalUser extends IUserBase {
	host: null;
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
}

export interface IRemoteUser extends IUserBase {
	inbox: string;
	uri: string;
	publicKey: {
		id: string;
		publicKeyPem: string;
	};
}

export type IUser = ILocalUser | IRemoteUser;

export const isLocalUser = (user: any): user is ILocalUser =>
	user.host === null;

export const isRemoteUser = (user: any): user is IRemoteUser =>
	!isLocalUser(user);

//#region Validators
export function validateUsername(username: string): boolean {
	return typeof username == 'string' && /^[a-zA-Z0-9_]{1,20}$/.test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidName(name?: string): boolean {
	return name === null || (typeof name == 'string' && name.length < 30 && name.trim() != '');
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
//#endregion

export function init(user): IUser {
	user._id = new mongo.ObjectID(user._id);
	user.avatarId = new mongo.ObjectID(user.avatarId);
	user.bannerId = new mongo.ObjectID(user.bannerId);
	user.pinnedNoteId = new mongo.ObjectID(user.pinnedNoteId);
	return user;
}

// TODO
export async function physicalDelete(user: string | mongo.ObjectID | IUser) {
	let u: IUser;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(user)) {
		u = await User.findOne({
			_id: user
		});
	} else if (typeof user === 'string') {
		u = await User.findOne({
			_id: new mongo.ObjectID(user)
		});
	} else {
		u = user as IUser;
	}

	if (u == null) return;

	// このユーザーが行った投稿をすべて削除
	const notes = await Note.find({ userId: u._id });
	await Promise.all(notes.map(n => physicalDeleteNote(n)));

	// このユーザーのお気に入りをすべて削除

	// このユーザーが行ったメッセージをすべて削除

	// このユーザーのドライブのファイルをすべて削除

	// このユーザーに関するfollowingをすべて削除

	// このユーザーを削除
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
		clientSettings: false,
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

	// TODO: ここでエラーにするのではなくダミーのユーザーデータを返す
	// SEE: https://github.com/syuilo/misskey/issues/1432
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
	delete _user.latestNote;

	if (_user.host == null) {
		// Remove private properties
		delete _user.keypair;
		delete _user.password;
		delete _user.token;
		delete _user.twoFactorTempSecret;
		delete _user.twoFactorSecret;
		delete _user.usernameLower;
		if (_user.twitter) {
			delete _user.twitter.accessToken;
			delete _user.twitter.accessTokenSecret;
		}
		delete _user.line;

		// Visible via only the official client
		if (!opts.includeSecrets) {
			delete _user.email;
			delete _user.settings;
			delete _user.clientSettings;
		}

		if (!opts.detail) {
			delete _user.twoFactorEnabled;
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
				followeeId: _user.id
			});
			return follow !== null;
		})();

		// Whether the user is followed
		_user.isFollowed = (async () => {
			const follow2 = await Following.findOne({
				followerId: _user.id,
				followeeId: meId
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
		if (_user.pinnedNoteId) {
			// Populate pinned note
			_user.pinnedNote = packNote(_user.pinnedNoteId, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriends(meId);

			// Get following you know count
			_user.followingYouKnowCount = Following.count({
				followeeId: { $in: myFollowingIds },
				followerId: _user.id
			});

			// Get followers you know count
			_user.followersYouKnowCount = Following.count({
				followeeId: _user.id,
				followerId: { $in: myFollowingIds }
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
