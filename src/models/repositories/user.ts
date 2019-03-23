import { EntityRepository, Repository } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '../entities/user';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	private async cloneOrFetch(x: User['id'] | User): Promise<User> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public async pack(
		user: User['id'] | User,
		me?: User['id'] | User,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
			includeHasUnreadNotes?: boolean
		}
	) {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false
		}, options);

		const _user = await this.cloneOrFetch(user);

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

		return _user;
	}

	public isLocalUser(user: any): user is ILocalUser {
		return user.host === null;
	}

	public isRemoteUser(user: any): user is IRemoteUser {
		return !this.isLocalUser(user);
	}

	//#region Validators
	public validateUsername(username: string, remote = false): boolean {
		return typeof username == 'string' && (remote ? /^\w([\w-]*\w)?$/ : /^\w{1,20}$/).test(username);
	}

	public validatePassword(password: string): boolean {
		return typeof password == 'string' && password != '';
	}

	public isValidName(name?: string): boolean {
		return name === null || (typeof name == 'string' && name.length < 50 && name.trim() != '');
	}

	public isValidDescription(description: string): boolean {
		return typeof description == 'string' && description.length < 500 && description.trim() != '';
	}

	public isValidLocation(location: string): boolean {
		return typeof location == 'string' && location.length < 50 && location.trim() != '';
	}

	public isValidBirthday(birthday: string): boolean {
		return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
	}
	//#endregion
}
