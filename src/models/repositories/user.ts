import $ from 'cafy';
import { EntityRepository, Repository, In, Not } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user';
import { Notes, NoteUnreads, FollowRequests, Notifications, MessagingMessages, UserNotePinings, Followings, Blockings, Mutings, UserProfiles, UserSecurityKeys, UserGroupJoinings, Pages, Announcements, AnnouncementReads, Antennas, AntennaNotes, ChannelFollowings, Instances } from '../index';
import config from '@/config/index';
import { Packed } from '@/misc/schema';
import { awaitAll } from '@/prelude/await-all';
import { populateEmojis } from '@/misc/populate-emojis';
import { getAntennas } from '@/misc/antenna-cache';
import { USER_ACTIVE_THRESHOLD, USER_ONLINE_THRESHOLD } from '@/const';

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
		const mute = await Mutings.find({
			muterId: userId
		});

		const joinings = await UserGroupJoinings.find({ userId: userId });

		const groupQs = Promise.all(joinings.map(j => MessagingMessages.createQueryBuilder('message')
			.where(`message.groupId = :groupId`, { groupId: j.userGroupId })
			.andWhere('message.userId != :userId', { userId: userId })
			.andWhere('NOT (:userId = ANY(message.reads))', { userId: userId })
			.andWhere('message.createdAt > :joinedAt', { joinedAt: j.createdAt }) // 自分が加入する前の会話については、未読扱いしない
			.getOne().then(x => x != null)));

		const [withUser, withGroups] = await Promise.all([
			MessagingMessages.count({
				where: {
					recipientId: userId,
					isRead: false,
					...(mute.length > 0 ? { userId: Not(In(mute.map(x => x.muteeId))) } : {}),
				},
				take: 1
			}).then(count => count > 0),
			groupQs
		]);

		return withUser || withGroups.some(x => x);
	}

	public async getHasUnreadAnnouncement(userId: User['id']): Promise<boolean> {
		const reads = await AnnouncementReads.find({
			userId: userId
		});

		const count = await Announcements.count(reads.length > 0 ? {
			id: Not(In(reads.map(read => read.announcementId)))
		} : {});

		return count > 0;
	}

	public async getHasUnreadAntenna(userId: User['id']): Promise<boolean> {
		const myAntennas = (await getAntennas()).filter(a => a.userId === userId);

		const unread = myAntennas.length > 0 ? await AntennaNotes.findOne({
			antennaId: In(myAntennas.map(x => x.id)),
			read: false
		}) : null;

		return unread != null;
	}

	public async getHasUnreadChannel(userId: User['id']): Promise<boolean> {
		const channels = await ChannelFollowings.find({ followerId: userId });

		const unread = channels.length > 0 ? await NoteUnreads.findOne({
			userId: userId,
			noteChannelId: In(channels.map(x => x.id)),
		}) : null;

		return unread != null;
	}

	public async getHasUnreadNotification(userId: User['id']): Promise<boolean> {
		const mute = await Mutings.find({
			muterId: userId
		});
		const mutedUserIds = mute.map(m => m.muteeId);

		const count = await Notifications.count({
			where: {
				notifieeId: userId,
				...(mutedUserIds.length > 0 ? { notifierId: Not(In(mutedUserIds)) } : {}),
				isRead: false
			},
			take: 1
		});

		return count > 0;
	}

	public async getHasPendingReceivedFollowRequest(userId: User['id']): Promise<boolean> {
		const count = await FollowRequests.count({
			followeeId: userId
		});

		return count > 0;
	}

	public getOnlineStatus(user: User): string {
		if (user.hideOnlineStatus) return 'unknown';
		if (user.lastActiveDate == null) return 'unknown';
		const elapsed = Date.now() - user.lastActiveDate.getTime();
		return (
			elapsed < USER_ONLINE_THRESHOLD ? 'online' :
			elapsed < USER_ACTIVE_THRESHOLD ? 'active' :
			'offline'
		);
	}

	public async pack(
		src: User['id'] | User,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
		}
	): Promise<Packed<'User'>> {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false
		}, options);

		const user = typeof src === 'object' ? src : await this.findOneOrFail(src);
		const meId = me ? me.id : null;

		const relation = meId && (meId !== user.id) && opts.detail ? await this.getRelation(meId, user.id) : null;
		const pins = opts.detail ? await UserNotePinings.createQueryBuilder('pin')
			.where('pin.userId = :userId', { userId: user.id })
			.innerJoinAndSelect('pin.note', 'note')
			.orderBy('pin.id', 'DESC')
			.getMany() : [];
		const profile = opts.detail ? await UserProfiles.findOneOrFail(user.id) : null;

		const falsy = opts.detail ? false : undefined;

		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: user.avatarUrl ? user.avatarUrl : config.url + '/avatar/' + user.id,
			avatarBlurhash: user.avatarBlurhash,
			avatarColor: null, // 後方互換性のため
			isAdmin: user.isAdmin || falsy,
			isModerator: user.isModerator || falsy,
			isBot: user.isBot || falsy,
			isCat: user.isCat || falsy,
			instance: user.host ? Instances.findOne({ host: user.host }).then(instance => instance ? {
				name: instance.name,
				softwareName: instance.softwareName,
				softwareVersion: instance.softwareVersion,
				iconUrl: instance.iconUrl,
				faviconUrl: instance.faviconUrl,
				themeColor: instance.themeColor,
			} : undefined) : undefined,
			emojis: populateEmojis(user.emojis, user.host),
			onlineStatus: this.getOnlineStatus(user),

			...(opts.detail ? {
				url: profile!.url,
				uri: user.uri,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
				lastFetchedAt: user.lastFetchedAt?.toISOString(),
				bannerUrl: user.bannerUrl,
				bannerBlurhash: user.bannerBlurhash,
				bannerColor: null, // 後方互換性のため
				isLocked: user.isLocked,
				isModerator: user.isModerator || falsy,
				isSilenced: user.isSilenced || falsy,
				isSuspended: user.isSuspended || falsy,
				description: profile!.description,
				location: profile!.location,
				birthday: profile!.birthday,
				lang: profile!.lang,
				fields: profile!.fields,
				followersCount: user.followersCount,
				followingCount: user.followingCount,
				notesCount: user.notesCount,
				pinnedNoteIds: pins.map(pin => pin.noteId),
				pinnedNotes: Notes.packMany(pins.map(pin => pin.note!), me, {
					detail: true
				}),
				pinnedPageId: profile!.pinnedPageId,
				pinnedPage: profile!.pinnedPageId ? Pages.pack(profile!.pinnedPageId, me) : null,
				twoFactorEnabled: profile!.twoFactorEnabled,
				usePasswordLessLogin: profile!.usePasswordLessLogin,
				securityKeys: profile!.twoFactorEnabled
					? UserSecurityKeys.count({
						userId: user.id
					}).then(result => result >= 1)
					: false,
			} : {}),

			...(opts.detail && meId === user.id ? {
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				injectFeaturedNote: profile!.injectFeaturedNote,
				receiveAnnouncementEmail: profile!.receiveAnnouncementEmail,
				alwaysMarkNsfw: profile!.alwaysMarkNsfw,
				carefulBot: profile!.carefulBot,
				autoAcceptFollowed: profile!.autoAcceptFollowed,
				noCrawle: profile!.noCrawle,
				isExplorable: user.isExplorable,
				isDeleted: user.isDeleted,
				hideOnlineStatus: user.hideOnlineStatus,
				hasUnreadSpecifiedNotes: NoteUnreads.count({
					where: { userId: user.id, isSpecified: true },
					take: 1
				}).then(count => count > 0),
				hasUnreadMentions: NoteUnreads.count({
					where: { userId: user.id, isMentioned: true },
					take: 1
				}).then(count => count > 0),
				hasUnreadAnnouncement: this.getHasUnreadAnnouncement(user.id),
				hasUnreadAntenna: this.getHasUnreadAntenna(user.id),
				hasUnreadChannel: this.getHasUnreadChannel(user.id),
				hasUnreadMessagingMessage: this.getHasUnreadMessagingMessage(user.id),
				hasUnreadNotification: this.getHasUnreadNotification(user.id),
				hasPendingReceivedFollowRequest: this.getHasPendingReceivedFollowRequest(user.id),
				integrations: profile!.integrations,
				mutedWords: profile!.mutedWords,
				mutingNotificationTypes: profile!.mutingNotificationTypes,
				emailNotificationTypes: profile!.emailNotificationTypes,
			} : {}),

			...(opts.includeSecrets ? {
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
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean,
			includeSecrets?: boolean,
		}
	) {
		return Promise.all(users.map(u => this.pack(u, me, options)));
	}

	public isLocalUser(user: User): user is ILocalUser;
	public isLocalUser<T extends { host: User['host'] }>(user: T): user is T & { host: null; };
	public isLocalUser(user: User | { host: User['host'] }): boolean {
		return user.host == null;
	}

	public isRemoteUser(user: User): user is IRemoteUser;
	public isRemoteUser<T extends { host: User['host'] }>(user: T): user is T & { host: string; };
	public isRemoteUser(user: User | { host: User['host'] }): boolean {
		return !this.isLocalUser(user);
	}

	//#region Validators
	public validateLocalUsername = $.str.match(/^\w{1,20}$/);
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
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			example: '藍'
		},
		username: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			example: 'ai'
		},
		host: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			example: 'misskey.example.com'
		},
		avatarUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: false as const,
		},
		avatarBlurhash: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
		},
		avatarColor: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
			default: null
		},
		isAdmin: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false
		},
		isModerator: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false
		},
		isBot: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		isCat: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		emojis: {
			type: 'array' as const,
			nullable: false as const, optional: false as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				properties: {
					name: {
						type: 'string' as const,
						nullable: false as const, optional: false as const
					},
					url: {
						type: 'string' as const,
						nullable: false as const, optional: false as const,
						format: 'url'
					},
				}
			}
		},
		url: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		createdAt: {
			type: 'string' as const,
			nullable: false as const, optional: true as const,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'date-time',
		},
		bannerUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		bannerBlurhash: {
			type: 'any' as const,
			nullable: true as const, optional: true as const,
		},
		bannerColor: {
			type: 'any' as const,
			nullable: true as const, optional: true as const,
			default: null
		},
		isLocked: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		isSuspended: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			example: false
		},
		description: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			example: 'Hi masters, I am Ai!'
		},
		location: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
		},
		birthday: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			example: '2018-03-12'
		},
		fields: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				properties: {
					name: {
						type: 'string' as const,
						nullable: false as const, optional: false as const
					},
					value: {
						type: 'string' as const,
						nullable: false as const, optional: false as const
					}
				},
				maxLength: 4
			}
		},
		followersCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
		},
		followingCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
		},
		notesCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
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
				ref: 'Note' as const,
			}
		},
		pinnedPageId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const
		},
		pinnedPage: {
			type: 'object' as const,
			nullable: true as const, optional: true as const,
			ref: 'Page' as const,
		},
		twoFactorEnabled: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false
		},
		usePasswordLessLogin: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false
		},
		securityKeys: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false
		},
		avatarId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'id'
		},
		bannerId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'id'
		},
		autoWatch: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const
		},
		injectFeaturedNote: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const
		},
		alwaysMarkNsfw: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const
		},
		carefulBot: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const
		},
		autoAcceptFollowed: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const
		},
		hasUnreadSpecifiedNotes: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadMentions: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadAnnouncement: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadAntenna: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadChannel: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadMessagingMessage: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadNotification: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasPendingReceivedFollowRequest: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		integrations: {
			type: 'object' as const,
			nullable: false as const, optional: true as const
		},
		mutedWords: {
			type: 'array' as const,
			nullable: false as const, optional: true as const
		},
		mutingNotificationTypes: {
			type: 'array' as const,
			nullable: false as const, optional: true as const
		},
		isFollowing: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		hasPendingFollowRequestFromYou: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		hasPendingFollowRequestToYou: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		isFollowed: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		isBlocking: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		isBlocked: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		},
		isMuted: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const
		}
	},
};
