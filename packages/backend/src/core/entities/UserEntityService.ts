import { Inject, Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';
import * as Redis from 'ioredis';
import Ajv from 'ajv';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/json-schema.js';
import type { Promiseable } from '@/misc/prelude/await-all.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { USER_ACTIVE_THRESHOLD, USER_ONLINE_THRESHOLD } from '@/const.js';
import type { Instance } from '@/models/entities/Instance.js';
import type { LocalUser, RemoteUser, User } from '@/models/entities/User.js';
import { birthdaySchema, descriptionSchema, localUsernameSchema, locationSchema, nameSchema, passwordSchema } from '@/models/entities/User.js';
import type { UsersRepository, UserSecurityKeysRepository, FollowingsRepository, FollowRequestsRepository, BlockingsRepository, MutingsRepository, DriveFilesRepository, NoteUnreadsRepository, ChannelFollowingsRepository, UserNotePiningsRepository, UserProfilesRepository, InstancesRepository, AnnouncementReadsRepository, AnnouncementsRepository, PagesRepository, UserProfile, RenoteMutingsRepository, UserMemoRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { AntennaService } from '../AntennaService.js';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { NoteEntityService } from './NoteEntityService.js';
import type { DriveFileEntityService } from './DriveFileEntityService.js';
import type { PageEntityService } from './PageEntityService.js';

type IsUserDetailed<Detailed extends boolean> = Detailed extends true ? Packed<'UserDetailed'> : Packed<'UserLite'>;
type IsMeAndIsUserDetailed<ExpectsMe extends boolean | null, Detailed extends boolean> =
	Detailed extends true ?
		ExpectsMe extends true ? Packed<'MeDetailed'> :
		ExpectsMe extends false ? Packed<'UserDetailedNotMe'> :
		Packed<'UserDetailed'> :
	Packed<'UserLite'>;

const ajv = new Ajv();

function isLocalUser(user: User): user is LocalUser;
function isLocalUser<T extends { host: User['host'] }>(user: T): user is T & { host: null; };
function isLocalUser(user: User | { host: User['host'] }): boolean {
	return user.host == null;
}

function isRemoteUser(user: User): user is RemoteUser;
function isRemoteUser<T extends { host: User['host'] }>(user: T): user is T & { host: string; };
function isRemoteUser(user: User | { host: User['host'] }): boolean {
	return !isLocalUser(user);
}

@Injectable()
export class UserEntityService implements OnModuleInit {
	private apPersonService: ApPersonService;
	private noteEntityService: NoteEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private pageEntityService: PageEntityService;
	private customEmojiService: CustomEmojiService;
	private antennaService: AntennaService;
	private roleService: RoleService;
	private federatedInstanceService: FederatedInstanceService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.noteUnreadsRepository)
		private noteUnreadsRepository: NoteUnreadsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.userNotePiningsRepository)
		private userNotePiningsRepository: UserNotePiningsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,
		
		@Inject(DI.userMemosRepository)
		private userMemosRepository: UserMemoRepository,

		//private noteEntityService: NoteEntityService,
		//private driveFileEntityService: DriveFileEntityService,
		//private pageEntityService: PageEntityService,
		//private customEmojiService: CustomEmojiService,
		//private antennaService: AntennaService,
		//private roleService: RoleService,
	) {
	}

	onModuleInit() {
		this.apPersonService = this.moduleRef.get('ApPersonService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.pageEntityService = this.moduleRef.get('PageEntityService');
		this.customEmojiService = this.moduleRef.get('CustomEmojiService');
		this.antennaService = this.moduleRef.get('AntennaService');
		this.roleService = this.moduleRef.get('RoleService');
		this.federatedInstanceService = this.moduleRef.get('FederatedInstanceService');
	}

	//#region Validators
	public validateLocalUsername = ajv.compile(localUsernameSchema);
	public validatePassword = ajv.compile(passwordSchema);
	public validateName = ajv.compile(nameSchema);
	public validateDescription = ajv.compile(descriptionSchema);
	public validateLocation = ajv.compile(locationSchema);
	public validateBirthday = ajv.compile(birthdaySchema);
	//#endregion

	public isLocalUser = isLocalUser;
	public isRemoteUser = isRemoteUser;

	@bindThis
	public async getRelation(me: User['id'], target: User['id']) {
		return awaitAll({
			id: target,
			isFollowing: this.followingsRepository.count({
				where: {
					followerId: me,
					followeeId: target,
				},
				take: 1,
			}).then(n => n > 0),
			isFollowed: this.followingsRepository.count({
				where: {
					followerId: target,
					followeeId: me,
				},
				take: 1,
			}).then(n => n > 0),
			hasPendingFollowRequestFromYou: this.followRequestsRepository.count({
				where: {
					followerId: me,
					followeeId: target,
				},
				take: 1,
			}).then(n => n > 0),
			hasPendingFollowRequestToYou: this.followRequestsRepository.count({
				where: {
					followerId: target,
					followeeId: me,
				},
				take: 1,
			}).then(n => n > 0),
			isBlocking: this.blockingsRepository.count({
				where: {
					blockerId: me,
					blockeeId: target,
				},
				take: 1,
			}).then(n => n > 0),
			isBlocked: this.blockingsRepository.count({
				where: {
					blockerId: target,
					blockeeId: me,
				},
				take: 1,
			}).then(n => n > 0),
			isMuted: this.mutingsRepository.count({
				where: {
					muterId: me,
					muteeId: target,
				},
				take: 1,
			}).then(n => n > 0),
			isRenoteMuted: this.renoteMutingsRepository.count({
				where: {
					muterId: me,
					muteeId: target,
				},
				take: 1,
			}).then(n => n > 0),
		});
	}

	@bindThis
	public async getHasUnreadAnnouncement(userId: User['id']): Promise<boolean> {
		const reads = await this.announcementReadsRepository.findBy({
			userId: userId,
		});

		const count = await this.announcementsRepository.countBy(reads.length > 0 ? {
			id: Not(In(reads.map(read => read.announcementId))),
		} : {});

		return count > 0;
	}

	@bindThis
	public async getHasUnreadAntenna(userId: User['id']): Promise<boolean> {
		/*
		const myAntennas = (await this.antennaService.getAntennas()).filter(a => a.userId === userId);

		const unread = myAntennas.length > 0 ? await this.antennaNotesRepository.findOneBy({
			antennaId: In(myAntennas.map(x => x.id)),
			read: false,
		}) : null;

		return unread != null;
		*/
		return false; // TODO
	}

	@bindThis
	public async getHasUnreadNotification(userId: User['id']): Promise<boolean> {
		const latestReadNotificationId = await this.redisClient.get(`latestReadNotification:${userId}`);

		const latestNotificationIdsRes = await this.redisClient.xrevrange(
			`notificationTimeline:${userId}`,
			'+',
			'-',
			'COUNT', 1);
		const latestNotificationId = latestNotificationIdsRes[0]?.[0];

		return latestNotificationId != null && (latestReadNotificationId == null || latestReadNotificationId < latestNotificationId);
	}

	@bindThis
	public async getHasPendingReceivedFollowRequest(userId: User['id']): Promise<boolean> {
		const count = await this.followRequestsRepository.countBy({
			followeeId: userId,
		});

		return count > 0;
	}

	@bindThis
	public getOnlineStatus(user: User): 'unknown' | 'online' | 'active' | 'offline' {
		if (user.hideOnlineStatus) return 'unknown';
		if (user.lastActiveDate == null) return 'unknown';
		const elapsed = Date.now() - user.lastActiveDate.getTime();
		return (
			elapsed < USER_ONLINE_THRESHOLD ? 'online' :
			elapsed < USER_ACTIVE_THRESHOLD ? 'active' :
			'offline'
		);
	}

	@bindThis
	public getIdenticonUrl(user: User): string {
		return `${this.config.url}/identicon/${user.username.toLowerCase()}@${user.host ?? this.config.host}`;
	}

	public async pack<ExpectsMe extends boolean | null = null, D extends boolean = false>(
		src: User['id'] | User,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: D,
			includeSecrets?: boolean,
			userProfile?: UserProfile,
		},
	): Promise<IsMeAndIsUserDetailed<ExpectsMe, D>> {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false,
		}, options);

		const user = typeof src === 'object' ? src : await this.usersRepository.findOneByOrFail({ id: src });

		// migration
		if (user.avatarId != null && user.avatarUrl === null) {
			const avatar = await this.driveFilesRepository.findOneByOrFail({ id: user.avatarId });
			user.avatarUrl = this.driveFileEntityService.getPublicUrl(avatar, 'avatar');
			this.usersRepository.update(user.id, {
				avatarUrl: user.avatarUrl,
				avatarBlurhash: avatar.blurhash,
			});
		}
		if (user.bannerId != null && user.bannerUrl === null) {
			const banner = await this.driveFilesRepository.findOneByOrFail({ id: user.bannerId });
			user.bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
			this.usersRepository.update(user.id, {
				bannerUrl: user.bannerUrl,
				bannerBlurhash: banner.blurhash,
			});
		}

		const meId = me ? me.id : null;
		const isMe = meId === user.id;

		const relation = meId && !isMe && opts.detail ? await this.getRelation(meId, user.id) : null;
		const pins = opts.detail ? await this.userNotePiningsRepository.createQueryBuilder('pin')
			.where('pin.userId = :userId', { userId: user.id })
			.innerJoinAndSelect('pin.note', 'note')
			.orderBy('pin.id', 'DESC')
			.getMany() : [];
		const profile = opts.detail ? (opts.userProfile ?? await this.userProfilesRepository.findOneByOrFail({ userId: user.id })) : null;

		const followingCount = profile == null ? null :
			(profile.ffVisibility === 'public') || isMe ? user.followingCount :
			(profile.ffVisibility === 'followers') && (relation && relation.isFollowing) ? user.followingCount :
			null;

		const followersCount = profile == null ? null :
			(profile.ffVisibility === 'public') || isMe ? user.followersCount :
			(profile.ffVisibility === 'followers') && (relation && relation.isFollowing) ? user.followersCount :
			null;

		const isModerator = isMe && opts.detail ? this.roleService.isModerator(user) : null;
		const isAdmin = isMe && opts.detail ? this.roleService.isAdministrator(user) : null;

		const falsy = opts.detail ? false : undefined;

		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: user.avatarUrl ?? this.getIdenticonUrl(user),
			avatarBlurhash: user.avatarBlurhash,
			isBot: user.isBot ?? falsy,
			isCat: user.isCat ?? falsy,
			instance: user.host ? this.federatedInstanceService.federatedInstanceCache.fetch(user.host).then(instance => instance ? {
				name: instance.name,
				softwareName: instance.softwareName,
				softwareVersion: instance.softwareVersion,
				iconUrl: instance.iconUrl,
				faviconUrl: instance.faviconUrl,
				themeColor: instance.themeColor,
			} : undefined) : undefined,
			emojis: this.customEmojiService.populateEmojis(user.emojis, user.host),
			onlineStatus: this.getOnlineStatus(user),
			// パフォーマンス上の理由でローカルユーザーのみ
			badgeRoles: user.host == null ? this.roleService.getUserBadgeRoles(user.id).then(rs => rs.sort((a, b) => b.displayOrder - a.displayOrder).map(r => ({
				name: r.name,
				iconUrl: r.iconUrl,
				displayOrder: r.displayOrder,
			}))) : undefined,

			...(opts.detail ? {
				url: profile!.url,
				uri: user.uri,
				movedToUri: user.movedToUri ? await this.apPersonService.resolvePerson(user.movedToUri) : null,
				alsoKnownAs: user.alsoKnownAs,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
				lastFetchedAt: user.lastFetchedAt ? user.lastFetchedAt.toISOString() : null,
				bannerUrl: user.bannerUrl,
				bannerBlurhash: user.bannerBlurhash,
				isLocked: user.isLocked,
				isSilenced: this.roleService.getUserPolicies(user.id).then(r => !r.canPublicNote),
				isSuspended: user.isSuspended ?? falsy,
				description: profile!.description,
				location: profile!.location,
				birthday: profile!.birthday,
				lang: profile!.lang,
				fields: profile!.fields,
				followersCount: followersCount ?? 0,
				followingCount: followingCount ?? 0,
				notesCount: user.notesCount,
				pinnedNoteIds: pins.map(pin => pin.noteId),
				pinnedNotes: this.noteEntityService.packMany(pins.map(pin => pin.note!), me, {
					detail: true,
				}),
				pinnedPageId: profile!.pinnedPageId,
				pinnedPage: profile!.pinnedPageId ? this.pageEntityService.pack(profile!.pinnedPageId, me) : null,
				publicReactions: profile!.publicReactions,
				ffVisibility: profile!.ffVisibility,
				twoFactorEnabled: profile!.twoFactorEnabled,
				usePasswordLessLogin: profile!.usePasswordLessLogin,
				securityKeys: profile!.twoFactorEnabled
					? this.userSecurityKeysRepository.countBy({
						userId: user.id,
					}).then(result => result >= 1)
					: false,
				roles: this.roleService.getUserRoles(user.id).then(roles => roles.filter(role => role.isPublic).sort((a, b) => b.displayOrder - a.displayOrder).map(role => ({
					id: role.id,
					name: role.name,
					color: role.color,
					iconUrl: role.iconUrl,
					description: role.description,
					isModerator: role.isModerator,
					isAdministrator: role.isAdministrator,
					displayOrder: role.displayOrder,
				}))),
				memo: meId == null ? null : await this.userMemosRepository.findOneBy({
					userId: meId,
					targetUserId: user.id,
				}).then(row => row?.memo ?? null),
			} : {}),

			...(opts.detail && isMe ? {
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				isModerator: isModerator,
				isAdmin: isAdmin,
				injectFeaturedNote: profile!.injectFeaturedNote,
				receiveAnnouncementEmail: profile!.receiveAnnouncementEmail,
				alwaysMarkNsfw: profile!.alwaysMarkNsfw,
				autoSensitive: profile!.autoSensitive,
				carefulBot: profile!.carefulBot,
				autoAcceptFollowed: profile!.autoAcceptFollowed,
				noCrawle: profile!.noCrawle,
				isExplorable: user.isExplorable,
				isDeleted: user.isDeleted,
				hideOnlineStatus: user.hideOnlineStatus,
				hasUnreadSpecifiedNotes: this.noteUnreadsRepository.count({
					where: { userId: user.id, isSpecified: true },
					take: 1,
				}).then(count => count > 0),
				hasUnreadMentions: this.noteUnreadsRepository.count({
					where: { userId: user.id, isMentioned: true },
					take: 1,
				}).then(count => count > 0),
				hasUnreadAnnouncement: this.getHasUnreadAnnouncement(user.id),
				hasUnreadAntenna: this.getHasUnreadAntenna(user.id),
				hasUnreadChannel: false, // 後方互換性のため
				hasUnreadNotification: this.getHasUnreadNotification(user.id),
				hasPendingReceivedFollowRequest: this.getHasPendingReceivedFollowRequest(user.id),
				mutedWords: profile!.mutedWords,
				mutedInstances: profile!.mutedInstances,
				mutingNotificationTypes: profile!.mutingNotificationTypes,
				emailNotificationTypes: profile!.emailNotificationTypes,
				showTimelineReplies: user.showTimelineReplies ?? falsy,
				achievements: profile!.achievements,
				loggedInDays: profile!.loggedInDates.length,
				policies: this.roleService.getUserPolicies(user.id),
			} : {}),

			...(opts.includeSecrets ? {
				email: profile!.email,
				emailVerified: profile!.emailVerified,
				securityKeysList: profile!.twoFactorEnabled
					? this.userSecurityKeysRepository.find({
						where: {
							userId: user.id,
						},
						select: {
							id: true,
							name: true,
							lastUsed: true,
						},
					})
					: [],
			} : {}),

			...(relation ? {
				isFollowing: relation.isFollowing,
				isFollowed: relation.isFollowed,
				hasPendingFollowRequestFromYou: relation.hasPendingFollowRequestFromYou,
				hasPendingFollowRequestToYou: relation.hasPendingFollowRequestToYou,
				isBlocking: relation.isBlocking,
				isBlocked: relation.isBlocked,
				isMuted: relation.isMuted,
				isRenoteMuted: relation.isRenoteMuted,
			} : {}),
		} as Promiseable<Packed<'User'>> as Promiseable<IsMeAndIsUserDetailed<ExpectsMe, D>>;

		return await awaitAll(packed);
	}

	public packMany<D extends boolean = false>(
		users: (User['id'] | User)[],
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: D,
			includeSecrets?: boolean,
		},
	): Promise<IsUserDetailed<D>[]> {
		return Promise.all(users.map(u => this.pack(u, me, options)));
	}
}
