import { EntityRepository, Repository } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '../entities/user';
import { Emojis, Notes } from '..';
import rap from '@prezzemolo/rap';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	private async cloneOrFetch(x: User['id'] | User, fields: (keyof User)[]): Promise<User> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x, {
				select: fields
			});
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

		const _user = await this.cloneOrFetch(user, opts.detail ? [] : [
			'name',
			'username',
			'host',
			'avatarColor',
			'avatarUrl',
			'emojis',
			'isCat',
			'isBot',
			'isAdmin',
			'isVerified'
		]);

		const meId = typeof me === 'string' ? me : me.id;

		const relation = meId && (meId !== _user.id) && opts.detail ? await getRelation(meId, _user.id) : null;

		return await rap({
			// カスタム絵文字添付
			emojis: Emojis.find({
				name: { $in: _user.emojis },
				host: _user.host
			}, {
				fields: { _id: false }
			}),

			...(opts.includeHasUnreadNotes ? {
				hasUnreadSpecifiedNotes: _user.hasUnreadSpecifiedNotes,
				hasUnreadMentions: _user.hasUnreadMentions,
			} : {}),

			...(opts.detail && _user.pinnedNoteIds.length > 0 ? {
				pinnedNotes: Notes.packMany(_user.pinnedNoteIds, meId, {
					detail: true
				}),
			} : {}),

			...(opts.detail && meId === _user.id ? {
				avatarId: _user.avatarId,
				bannerId: _user.bannerId,
				hasUnreadMessagingMessage: _user.hasUnreadMessagingMessage,
				hasUnreadNotification: _user.hasUnreadNotification,
			} : {}),

			...(relation ? {
				isFollowing: relation.isFollowing,
				isFollowed: relation.isFollowed,
				hasPendingFollowRequestFromYou: relation.hasPendingFollowRequestFromYou,
				hasPendingFollowRequestToYou: relation.hasPendingFollowRequestToYou,
				isBlocking: relation.isBlocking,
				isBlocked: relation.isBlocked,
				isMuted: relation.isMuted,
			} : {})
		});
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
