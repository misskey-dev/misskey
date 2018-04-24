import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import Note, { pack as packNote, deleteNote } from './note';
import Following, { deleteFollowing } from './following';
import Mute, { deleteMute } from './mute';
import { getFriendIds } from '../server/api/common/get-friends';
import config from '../config';
import AccessToken, { deleteAccessToken } from './access-token';
import NoteWatching, { deleteNoteWatching } from './note-watching';
import Favorite, { deleteFavorite } from './favorite';
import NoteReaction, { deleteNoteReaction } from './note-reaction';
import MessagingMessage, { deleteMessagingMessage } from './messaging-message';
import MessagingHistory, { deleteMessagingHistory } from './messaging-history';
import DriveFile, { deleteDriveFile } from './drive-file';
import DriveFolder, { deleteDriveFolder } from './drive-folder';
import PollVote, { deletePollVote } from './poll-vote';
import FollowingLog, { deleteFollowingLog } from './following-log';
import FollowedLog, { deleteFollowedLog } from './followed-log';
import SwSubscription, { deleteSwSubscription } from './sw-subscription';
import Notification, { deleteNotification } from './notification';
import UserList, { deleteUserList } from './user-list';

const User = db.get<IUser>('users');

User.createIndex('username');
User.createIndex('usernameLower');
User.createIndex(['username', 'host'], { unique: true });
User.createIndex(['usernameLower', 'host'], { unique: true });
User.createIndex('token', { sparse: true, unique: true });
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
	pinnedNoteId: mongo.ObjectID;
	isSuspended: boolean;
	keywords: string[];
	host: string;
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
	url?: string;
	publicKey: {
		id: string;
		publicKeyPem: string;
	};
	updatedAt: Date;
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

/**
 * Userを物理削除します
 */
export async function deleteUser(user: string | mongo.ObjectID | IUser) {
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

	console.log(u == null ? `User: delete skipped ${user}` : `User: deleting ${u._id}`);

	if (u == null) return;

	// このユーザーのAccessTokenをすべて削除
	await Promise.all((
		await AccessToken.find({ userId: u._id })
	).map(x => deleteAccessToken(x)));

	// このユーザーのNoteをすべて削除
	await Promise.all((
		await Note.find({ userId: u._id })
	).map(x => deleteNote(x)));

	// このユーザーのNoteReactionをすべて削除
	await Promise.all((
		await NoteReaction.find({ userId: u._id })
	).map(x => deleteNoteReaction(x)));

	// このユーザーのNoteWatchingをすべて削除
	await Promise.all((
		await NoteWatching.find({ userId: u._id })
	).map(x => deleteNoteWatching(x)));

	// このユーザーのPollVoteをすべて削除
	await Promise.all((
		await PollVote.find({ userId: u._id })
	).map(x => deletePollVote(x)));

	// このユーザーのFavoriteをすべて削除
	await Promise.all((
		await Favorite.find({ userId: u._id })
	).map(x => deleteFavorite(x)));

	// このユーザーのMessageをすべて削除
	await Promise.all((
		await MessagingMessage.find({ userId: u._id })
	).map(x => deleteMessagingMessage(x)));

	// このユーザーへのMessageをすべて削除
	await Promise.all((
		await MessagingMessage.find({ recipientId: u._id })
	).map(x => deleteMessagingMessage(x)));

	// このユーザーの関わるMessagingHistoryをすべて削除
	await Promise.all((
		await MessagingHistory.find({ $or: [{ partnerId: u._id }, { userId: u._id }] })
	).map(x => deleteMessagingHistory(x)));

	// このユーザーのDriveFileをすべて削除
	await Promise.all((
		await DriveFile.find({ 'metadata.userId': u._id })
	).map(x => deleteDriveFile(x)));

	// このユーザーのDriveFolderをすべて削除
	await Promise.all((
		await DriveFolder.find({ userId: u._id })
	).map(x => deleteDriveFolder(x)));

	// このユーザーのMuteをすべて削除
	await Promise.all((
		await Mute.find({ muterId: u._id })
	).map(x => deleteMute(x)));

	// このユーザーへのMuteをすべて削除
	await Promise.all((
		await Mute.find({ muteeId: u._id })
	).map(x => deleteMute(x)));

	// このユーザーのFollowingをすべて削除
	await Promise.all((
		await Following.find({ followerId: u._id })
	).map(x => deleteFollowing(x)));

	// このユーザーへのFollowingをすべて削除
	await Promise.all((
		await Following.find({ followeeId: u._id })
	).map(x => deleteFollowing(x)));

	// このユーザーのFollowingLogをすべて削除
	await Promise.all((
		await FollowingLog.find({ userId: u._id })
	).map(x => deleteFollowingLog(x)));

	// このユーザーのFollowedLogをすべて削除
	await Promise.all((
		await FollowedLog.find({ userId: u._id })
	).map(x => deleteFollowedLog(x)));

	// このユーザーのSwSubscriptionをすべて削除
	await Promise.all((
		await SwSubscription.find({ userId: u._id })
	).map(x => deleteSwSubscription(x)));

	// このユーザーのNotificationをすべて削除
	await Promise.all((
		await Notification.find({ notifieeId: u._id })
	).map(x => deleteNotification(x)));

	// このユーザーが原因となったNotificationをすべて削除
	await Promise.all((
		await Notification.find({ notifierId: u._id })
	).map(x => deleteNotification(x)));

	// このユーザーのUserListをすべて削除
	await Promise.all((
		await UserList.find({ userId: u._id })
	).map(x => deleteUserList(x)));

	// このユーザーの入っているすべてのUserListからこのユーザーを削除
	await Promise.all((
		await UserList.find({ userIds: u._id })
	).map(x =>
		UserList.update({ _id: x._id }, {
			$pull: { userIds: u._id }
		})
	));

	// このユーザーを削除
	await User.remove({
		_id: u._id
	});

	console.log(`User: deleted ${u._id}`);
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
	} else {
		delete _user.publicKey;
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
		const [following1, following2, mute] = await Promise.all([
			Following.findOne({
				followerId: meId,
				followeeId: _user.id
			}),
			Following.findOne({
				followerId: _user.id,
				followeeId: meId
			}),
			Mute.findOne({
				muterId: meId,
				muteeId: _user.id
			})
		]);

		// Whether the user is following
		_user.isFollowing = following1 !== null;
		_user.isStalking = following1 && following1.stalk;

		// Whether the user is followed
		_user.isFollowed = following2 !== null;

		// Whether the user is muted
		_user.isMuted = mute !== null;
	}

	if (opts.detail) {
		if (_user.pinnedNoteId) {
			// Populate pinned note
			_user.pinnedNote = packNote(_user.pinnedNoteId, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriendIds(meId);

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
