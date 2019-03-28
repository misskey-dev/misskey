import { EntityRepository, Repository, In } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '../entities/user';
import { Emojis, Notes, NoteUnreads, FollowRequests, Notifications, MessagingMessages, UserNotePinings } from '..';
import rap from '@prezzemolo/rap';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	public async pack(
		user: User['id'] | User,
		me?: User['id'] | User,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
			includeHasUnreadNotes?: boolean
		}
	): Promise<Record<string, any>> {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false
		}, options);

		const _user = typeof user === 'object' ? user : await this.findOne(user);
		const meId = me ? typeof me === 'string' ? me : me.id : null;

		const relation = meId && (meId !== _user.id) && opts.detail ? await getRelation(meId, _user.id) : null;

		return await rap({
			id: _user.id,
			name: _user.name,
			username: _user.username,
			host: _user.host,
			avatarUrl: _user.avatarUrl,
			bannerUrl: _user.bannerUrl,
			avatarColor: _user.avatarColor,
			bannerColor: _user.bannerColor,

			// カスタム絵文字添付
			emojis: _user.emojis.length > 0 ? Emojis.find({
				where: {
					name: In(_user.emojis),
					host: _user.host
				},
				select: ['name', 'host', 'url', 'aliases']
			}) : [],

			...(opts.includeHasUnreadNotes ? {
				hasUnreadSpecifiedNotes: NoteUnreads.count({
					where: { userId: _user.id, isSpecified: true },
					take: 1
				}).then(count => count > 0),
				hasUnreadMentions: NoteUnreads.count({
					where: { userId: _user.id },
					take: 1
				}).then(count => count > 0),
			} : {}),

			...(opts.detail ? {
				pinnedNotes: UserNotePinings.find({ userId: _user.id }).then(pins =>
					Notes.packMany(pins.map(pin => pin.id), meId, {
						detail: true
					})),
			} : {}),

			...(opts.detail && meId === _user.id ? {
				avatarId: _user.avatarId,
				bannerId: _user.bannerId,
				alwaysMarkNsfw: _user.alwaysMarkNsfw,
				carefulBot: _user.carefulBot,
				hasUnreadMessagingMessage: MessagingMessages.count({
					where: {
						recipientId: _user.id,
						isRead: false
					},
					take: 1
				}).then(count => count > 0),
				hasUnreadNotification: Notifications.count({
					where: {
						userId: _user.id,
						isRead: false
					},
					take: 1
				}).then(count => count > 0),
				pendingReceivedFollowRequestsCount: FollowRequests.count({
					followeeId: _user.id
				}),
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

	public isLocalUser(user: User): user is ILocalUser {
		return user.host === null;
	}

	public isRemoteUser(user: User): user is IRemoteUser {
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
