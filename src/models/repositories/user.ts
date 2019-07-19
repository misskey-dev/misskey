import $ from 'cafy';
import { EntityRepository, Repository, In } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '../entities/user';
import { Emojis, Notes, NoteUnreads, FollowRequests, Notifications, MessagingMessages, UserNotePinings, Followings, Blockings, Mutings, UserProfiles, UserSecurityKeys, UserGroupJoinings, Pages } from '..';
import { ensure } from '../../prelude/ensure';
import config from '../../config';
import { SchemaType } from '../../misc/schema';
import { awaitAll } from '../../prelude/await-all';

export type PackedUser = SchemaType<typeof packedUserSchema>;

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	public async getRelation(me: User['id'], target: User['id']) {
		const [following1, following2, followReq1, followReq2, toBlocking, fromBlocked, mute] = await Promise.all([
			Followings.findOne({
				followerId: me,
				followeeId: target
			}),
			Followings.findOne({
				followerId: target,
				followeeId: me
			}),
			FollowRequests.findOne({
				followerId: me,
				followeeId: target
			}),
			FollowRequests.findOne({
				followerId: target,
				followeeId: me
			}),
			Blockings.findOne({
				blockerId: me,
				blockeeId: target
			}),
			Blockings.findOne({
				blockerId: target,
				blockeeId: me
			}),
			Mutings.findOne({
				muterId: me,
				muteeId: target
			})
		]);

		return {
			id: target,
			isFollowing: following1 != null,
			hasPendingFollowRequestFromYou: followReq1 != null,
			hasPendingFollowRequestToYou: followReq2 != null,
			isFollowed: following2 != null,
			isBlocking: toBlocking != null,
			isBlocked: fromBlocked != null,
			isMuted: mute != null
		};
	}

	public async getHasUnreadMessagingMessage(userId: User['id']): Promise<boolean> {
		const joinings = await UserGroupJoinings.find({ userId: userId });

		const groupQs = Promise.all(joinings.map(j => MessagingMessages.createQueryBuilder('message')
			.where(`message.groupId = :groupId`, { groupId: j.userGroupId })
			.andWhere('message.userId != :userId', { userId: userId })
			.andWhere('NOT (:userId = ANY(message.reads))', { userId: userId })
			.andWhere('message.createdAt > :joinedAt', { joinedAt: j.createdAt }) // 自分が加入する前の会話については、未読扱いしない
			.getOne().then(x => x != null)));

		const [withUser, withGroups] = await Promise.all([
			// TODO: ミュートを考慮
			MessagingMessages.count({
				where: {
					recipientId: userId,
					isRead: false
				},
				take: 1
			}).then(count => count > 0),
			groupQs
		]);

		return withUser || withGroups.some(x => x);
	}

	public async pack(
		src: User['id'] | User,
		me?: User['id'] | User | null | undefined,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
			includeHasUnreadNotes?: boolean
		}
	): Promise<PackedUser> {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false
		}, options);

		const user = typeof src === 'object' ? src : await this.findOne(src).then(ensure);
		const meId = me ? typeof me === 'string' ? me : me.id : null;

		const relation = meId && (meId !== user.id) && opts.detail ? await this.getRelation(meId, user.id) : null;
		const pins = opts.detail ? await UserNotePinings.find({
			where: { userId: user.id },
			order: { id: 'DESC' }
		}) : [];
		const profile = opts.detail ? await UserProfiles.findOne(user.id).then(ensure) : null;

		const falsy = opts.detail ? false : undefined;

		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: user.avatarUrl ? user.avatarUrl : config.url + '/avatar/' + user.id,
			avatarColor: user.avatarColor,
			isAdmin: user.isAdmin || falsy,
			isBot: user.isBot || falsy,
			isCat: user.isCat || falsy,

			// カスタム絵文字添付
			emojis: user.emojis.length > 0 ? Emojis.find({
				where: {
					name: In(user.emojis),
					host: user.host
				},
				select: ['name', 'host', 'url', 'aliases']
			}) : [],

			...(opts.includeHasUnreadNotes ? {
				hasUnreadSpecifiedNotes: NoteUnreads.count({
					where: { userId: user.id, isSpecified: true },
					take: 1
				}).then(count => count > 0),
				hasUnreadMentions: NoteUnreads.count({
					where: { userId: user.id },
					take: 1
				}).then(count => count > 0),
			} : {}),

			...(opts.detail ? {
				url: profile!.url,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
				bannerUrl: user.bannerUrl,
				bannerColor: user.bannerColor,
				isLocked: user.isLocked,
				isModerator: user.isModerator || falsy,
				description: profile!.description,
				location: profile!.location,
				birthday: profile!.birthday,
				fields: profile!.fields,
				followersCount: user.followersCount,
				followingCount: user.followingCount,
				notesCount: user.notesCount,
				pinnedNoteIds: pins.map(pin => pin.noteId),
				pinnedNotes: Notes.packMany(pins.map(pin => pin.noteId), meId, {
					detail: true
				}),
				pinnedPageId: profile!.pinnedPageId,
				pinnedPage: profile!.pinnedPageId ? Pages.pack(profile!.pinnedPageId, meId) : null,
				twoFactorEnabled: profile!.twoFactorEnabled,
				usePasswordLessLogin: profile!.usePasswordLessLogin,
				securityKeys: profile!.twoFactorEnabled
					? UserSecurityKeys.count({
						userId: user.id
					}).then(result => result >= 1)
					: false,
				twitter: profile!.twitter ? {
					id: profile!.twitterUserId,
					screenName: profile!.twitterScreenName
				} : null,
				github: profile!.github ? {
					id: profile!.githubId,
					login: profile!.githubLogin
				} : null,
				discord: profile!.discord ? {
					id: profile!.discordId,
					username: profile!.discordUsername,
					discriminator: profile!.discordDiscriminator
				} : null,
			} : {}),

			...(opts.detail && meId === user.id ? {
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				autoWatch: profile!.autoWatch,
				alwaysMarkNsfw: profile!.alwaysMarkNsfw,
				carefulBot: profile!.carefulBot,
				autoAcceptFollowed: profile!.autoAcceptFollowed,
				hasUnreadMessagingMessage: this.getHasUnreadMessagingMessage(user.id),
				hasUnreadNotification: Notifications.count({
					where: {
						notifieeId: user.id,
						isRead: false
					},
					take: 1
				}).then(count => count > 0),
				pendingReceivedFollowRequestsCount: FollowRequests.count({
					followeeId: user.id
				}),
			} : {}),

			...(opts.includeSecrets ? {
				clientData: profile!.clientData,
				email: profile!.email,
				emailVerified: profile!.emailVerified,
				securityKeysList: profile!.twoFactorEnabled
					? UserSecurityKeys.find({
						where: {
							userId: user.id
						},
						select: ['id', 'name', 'lastUsed']
					})
					: []
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
		};

		return await awaitAll(packed);
	}

	public packMany(
		users: (User['id'] | User)[],
		me?: User['id'] | User | null | undefined,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
			includeHasUnreadNotes?: boolean
		}
	) {
		return Promise.all(users.map(u => this.pack(u, me, options)));
	}

	public isLocalUser(user: User): user is ILocalUser {
		return user.host == null;
	}

	public isRemoteUser(user: User): user is IRemoteUser {
		return !this.isLocalUser(user);
	}

	//#region Validators
	public validateLocalUsername = $.str.match(/^\w{1,20}$/);
	public validateRemoteUsername = $.str.match(/^\w([\w-]*\w)?$/);
	public validatePassword = $.str.min(1);
	public validateName = $.str.min(1).max(50);
	public validateDescription = $.str.min(1).max(500);
	public validateLocation = $.str.min(1).max(50);
	public validateBirthday = $.str.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
	//#endregion
}

export const packedUserSchema = {
	type: 'object' as const,
	nullable: false as const, optional: false as const,
	properties: {
		id: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			format: 'id',
			description: 'The unique identifier for this User.',
			example: 'xxxxxxxxxx',
		},
		username: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			description: 'The screen name, handle, or alias that this user identifies themselves with.',
			example: 'ai'
		},
		name: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			description: 'The name of the user, as they’ve defined it.',
			example: '藍'
		},
		url: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		avatarUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: false as const,
		},
		avatarColor: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
		},
		bannerUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		bannerColor: {
			type: 'any' as const,
			nullable: true as const, optional: true as const,
		},
		emojis: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
		},
		host: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			example: 'misskey.example.com'
		},
		description: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			description: 'The user-defined UTF-8 string describing their account.',
			example: 'Hi masters, I am Ai!'
		},
		birthday: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			example: '2018-03-12'
		},
		createdAt: {
			type: 'string' as const,
			nullable: false as const, optional: true as const,
			format: 'date-time',
			description: 'The date that the user account was created on Misskey.'
		},
		updatedAt: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'date-time',
		},
		location: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
		},
		followersCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
			description: 'The number of followers this account currently has.'
		},
		followingCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
			description: 'The number of users this account is following.'
		},
		notesCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
			description: 'The number of Notes (including renotes) issued by the user.'
		},
		isBot: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			description: 'Whether this account is a bot.'
		},
		pinnedNoteIds: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				format: 'id',
			}
		},
		pinnedNotes: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				ref: 'Note'
			}
		},
		isCat: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			description: 'Whether this account is a cat.'
		},
		isAdmin: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			description: 'Whether this account is the admin.'
		},
		isModerator: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			description: 'Whether this account is a moderator.'
		},
		isLocked: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadSpecifiedNotes: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadMentions: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
	},
};
