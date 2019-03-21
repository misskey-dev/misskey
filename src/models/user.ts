import { Entity, PrimaryGeneratedColumn, Column, Index, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import rap from '@prezzemolo/rap';
import { packMany as packNoteMany } from './note';
import config from '../config';
import Emoji from './emoji';
import { DriveFile } from './drive-file';

@Entity()
@Index(['usernameLower', 'host'], { unique: true })
export class User {
	@PrimaryColumn({
		type: 'char', length: 24,
		comment: 'The ID of the User.'
	})
	public id: string;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the User.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'date', nullable: true,
		comment: 'The updated date of the User.'
	})
	public updatedAt: Date | null;

	@Column({
		type: 'varchar', length: 128,
		comment: 'The username of the User.'
	})
	public username: string;

	@Index()
	@Column({
		type: 'varchar', length: 128,
		comment: 'The username (lowercased) of the User.'
	})
	public usernameLower: string;

	@Column({
		type: 'varchar', length: 128, nullable: true,
		comment: 'The name of the User.'
	})
	public name: string | null;

	@Column({
		type: 'varchar', length: 128, nullable: true,
		comment: 'The location of the User.'
	})
	public location: string | null;

	@Column({
		type: 'char', length: 10, nullable: true,
		comment: 'The birthday (YYYY-MM-DD) of the User.'
	})
	public birthday: string | null;

	@Column({
		type: 'integer', default: 0,
		comment: 'The count of followers.'
	})
	public followersCount: number;

	@Column({
		type: 'integer', default: 0,
		comment: 'The count of following.'
	})
	public followingCount: number;

	@Column({
		type: 'integer', default: 0,
		comment: 'The count of notes.'
	})
	public notesCount: number;

	@Column({
		type: 'integer', nullable: true,
		comment: 'The ID of avatar DriveFile.'
	})
	public avatarId: number | null;

	@OneToOne(type => DriveFile, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public avatar: DriveFile | null;

	@Column({
		type: 'integer', nullable: true,
		comment: 'The ID of banner DriveFile.'
	})
	public bannerId: number | null;

	@OneToOne(type => DriveFile, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public banner: DriveFile | null;

	@Column({
		type: 'varchar', length: 1024, nullable: true,
		comment: 'The description (bio) of the User.'
	})
	public description: string | null;

	@Column({
		type: 'varchar', length: 128, nullable: true,
		comment: 'The email address of the User.'
	})
	public email: string | null;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is suspended.'
	})
	public isSuspended: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is silenced.'
	})
	public isSilenced: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is locked.'
	})
	public isLocked: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is a bot.'
	})
	public isBot: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is a cat.'
	})
	public isCat: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is the admin.'
	})
	public isAdmin: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
		comment: 'Whether the User is a moderator.'
	})
	public isModerator: boolean;

	@Index()
	@Column({
		type: 'varchar', length: 128, nullable: true,
		comment: 'The host of the User. It will be null if the origin of the user is local.'
	})
	public host: string | null;

	@Index()
	@Column({
		type: 'varchar', length: 256, nullable: true,
		comment: 'The URI of the User. It will be null if the origin of the user is local.'
	})
	public uri: string | null;

	@Column({
		type: 'varchar', length: 128, nullable: true,
		comment: 'The password hash of the User. It will be null if the origin of the user is local.'
	})
	public password: string | null;

	@Index({ unique: true })
	@Column({
		type: 'varchar', length: 32, nullable: true, unique: true,
		comment: 'The native access token of the User. It will be null if the origin of the user is local.'
	})
	public token: string | null;

	@Column({
		type: 'varchar', length: 256, nullable: true,
		comment: 'The keypair of the User. It will be null if the origin of the user is local.'
	})
	public keypair: string | null;

	@Column({
		type: 'jsonb', nullable: false, default: {},
		comment: 'The client-specific data of the User.'
	})
	public clientData: Record<string, any>;

	@Column({
		type: 'jsonb', nullable: false, default: {},
		comment: 'The external service links of the User.'
	})
	public services: Record<string, any>;

	@Column({
		type: 'boolean', nullable: false, default: false,
	})
	public autoWatch: boolean;

	@Column({
		type: 'boolean', nullable: false, default: false,
	})
	public autoAcceptFollowed: boolean;
}

export interface ILocalUser extends User {
	host: null;
}

export interface IRemoteUser extends User {
	host: string;
}

export type IUser = ILocalUser | IRemoteUser;

export const isLocalUser = (user: any): user is ILocalUser =>
	user.host === null;

export const isRemoteUser = (user: any): user is IRemoteUser =>
	!isLocalUser(user);

//#region Validators
export function validateUsername(username: string, remote = false): boolean {
	return typeof username == 'string' && (remote ? /^\w([\w-]*\w)?$/ : /^\w{1,20}$/).test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidName(name?: string): boolean {
	return name === null || (typeof name == 'string' && name.length < 50 && name.trim() != '');
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

async function cloneOrFetch(x: string | User): Promise<User> {
	if (typeof x === 'string') {
		return await Users.findOne(x);
	} else {
		return JSON.parse(JSON.stringify(x));
	}
}

/**
 * Pack a user for API response
 */
export const pack = (
	user: string | User,
	me?: string | User,
	options?: {
		detail?: boolean,
		includeSecrets?: boolean,
		includeHasUnreadNotes?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false,
		includeSecrets: false
	}, options);

	const _user = await cloneOrFetch(user);

	const fields = opts.detail ? {} : {
		name: true,
		username: true,
		host: true,
		avatarColor: true,
		avatarUrl: true,
		emojis: true,
		isCat: true,
		isBot: true,
		isAdmin: true,
		isVerified: true
	};

	const meId = typeof me === 'string' ? me : me.id;

	delete _user.usernameLower;
	delete _user.emailVerifyCode;

	if (_user.host == null) {
		// Remove private properties
		delete _user.keypair;
		delete _user.password;
		delete _user.token;
		delete _user.twoFactorTempSecret;
		delete _user.two_factor_temp_secret; // 後方互換性のため
		delete _user.twoFactorSecret;
		if (_user.twitter) {
			delete _user.twitter.accessToken;
			delete _user.twitter.accessTokenSecret;
		}
		if (_user.github) {
			delete _user.github.accessToken;
		}
		if (_user.discord) {
			delete _user.discord.accessToken;
			delete _user.discord.refreshToken;
			delete _user.discord.expiresDate;
		}

		// Visible via only the official client
		if (!opts.includeSecrets) {
			delete _user.email;
			delete _user.emailVerified;
			delete _user.settings;
			delete _user.clientSettings;
		}

		if (!opts.detail) {
			delete _user.twoFactorEnabled;
		}
	} else {
		delete _user.publicKey;
	}

	if (_user.avatarUrl == null) {
		_user.avatarUrl = `${config.driveUrl}/default-avatar.jpg`;
	}

	if (!meId || !meId.equals(_user.id) || !opts.detail) {
		delete _user.avatarId;
		delete _user.bannerId;
		delete _user.hasUnreadMessagingMessage;
		delete _user.hasUnreadNotification;
	}

	if (meId && !meId.equals(_user.id) && opts.detail) {
		const relation = await getRelation(meId, _user.id);

		_user.isFollowing = relation.isFollowing;
		_user.isFollowed = relation.isFollowed;
		_user.hasPendingFollowRequestFromYou = relation.hasPendingFollowRequestFromYou;
		_user.hasPendingFollowRequestToYou = relation.hasPendingFollowRequestToYou;
		_user.isBlocking = relation.isBlocking;
		_user.isBlocked = relation.isBlocked;
		_user.isMuted = relation.isMuted;
	}

	if (opts.detail) {
		if (_user.pinnedNoteIds) {
			// Populate pinned notes
			_user.pinnedNotes = packNoteMany(_user.pinnedNoteIds, meId, {
				detail: true
			});
		}
	}

	if (!opts.includeHasUnreadNotes) {
		delete _user.hasUnreadSpecifiedNotes;
		delete _user.hasUnreadMentions;
	}

	// カスタム絵文字添付
	if (_user.emojis) {
		_user.emojis = Emoji.find({
			name: { $in: _user.emojis },
			host: _user.host
		}, {
			fields: { _id: false }
		});
	}

	// resolve promises in _user object
	_user = await rap(_user);

	resolve(_user);
});
