/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import _Ajv from 'ajv';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/json-schema.js';
import type { Promiseable } from '@/misc/prelude/await-all.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { USER_ACTIVE_THRESHOLD, USER_ONLINE_THRESHOLD } from '@/const.js';
import type { MiLocalUser, MiPartialLocalUser, MiPartialRemoteUser, MiRemoteUser, MiUser } from '@/models/User.js';
import {
	birthdaySchema,
	descriptionSchema,
	localUsernameSchema,
	locationSchema,
	nameSchema,
	passwordSchema,
} from '@/models/User.js';
import type {
	BlockingsRepository,
	FollowingsRepository,
	FollowRequestsRepository,
	MiFollowing,
	MiMeta,
	MiUserNotePining,
	MiUserProfile,
	MutingsRepository,
	RenoteMutingsRepository,
	UserMemoRepository,
	UserNotePiningsRepository,
	UserProfilesRepository,
	UserSecurityKeysRepository,
	UsersRepository,
} from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { IdService } from '@/core/IdService.js';
import type { AnnouncementService } from '@/core/AnnouncementService.js';
import type { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { ChatService } from '@/core/ChatService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { NoteEntityService } from './NoteEntityService.js';
import type { PageEntityService } from './PageEntityService.js';

const Ajv = _Ajv.default;
const ajv = new Ajv();

function isLocalUser(user: MiUser): user is MiLocalUser;
function isLocalUser<T extends { host: MiUser['host'] }>(user: T): user is (T & { host: null; });

function isLocalUser(user: MiUser | { host: MiUser['host'] }): boolean {
	return user.host == null;
}

function isRemoteUser(user: MiUser): user is MiRemoteUser;
function isRemoteUser<T extends { host: MiUser['host'] }>(user: T): user is (T & { host: string; });

function isRemoteUser(user: MiUser | { host: MiUser['host'] }): boolean {
	return !isLocalUser(user);
}

export type UserRelation = {
	id: MiUser['id']
	following: MiFollowing | null,
	isFollowing: boolean
	isFollowed: boolean
	hasPendingFollowRequestFromYou: boolean
	hasPendingFollowRequestToYou: boolean
	isBlocking: boolean
	isBlocked: boolean
	isMuted: boolean
	isRenoteMuted: boolean
};

@Injectable()
export class UserEntityService implements OnModuleInit {
	private apPersonService: ApPersonService;
	private noteEntityService: NoteEntityService;
	private pageEntityService: PageEntityService;
	private customEmojiService: CustomEmojiService;
	private announcementService: AnnouncementService;
	private roleService: RoleService;
	private federatedInstanceService: FederatedInstanceService;
	private idService: IdService;
	private avatarDecorationService: AvatarDecorationService;
	private chatService: ChatService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

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

		@Inject(DI.userNotePiningsRepository)
		private userNotePiningsRepository: UserNotePiningsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userMemosRepository)
		private userMemosRepository: UserMemoRepository,
	) {
	}

	onModuleInit() {
		this.apPersonService = this.moduleRef.get('ApPersonService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.pageEntityService = this.moduleRef.get('PageEntityService');
		this.customEmojiService = this.moduleRef.get('CustomEmojiService');
		this.announcementService = this.moduleRef.get('AnnouncementService');
		this.roleService = this.moduleRef.get('RoleService');
		this.federatedInstanceService = this.moduleRef.get('FederatedInstanceService');
		this.idService = this.moduleRef.get('IdService');
		this.avatarDecorationService = this.moduleRef.get('AvatarDecorationService');
		this.chatService = this.moduleRef.get('ChatService');
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
	public async getRelation(me: MiUser['id'], target: MiUser['id']): Promise<UserRelation> {
		const [
			following,
			isFollowed,
			hasPendingFollowRequestFromYou,
			hasPendingFollowRequestToYou,
			isBlocking,
			isBlocked,
			isMuted,
			isRenoteMuted,
		] = await Promise.all([
			this.followingsRepository.findOneBy({
				followerId: me,
				followeeId: target,
			}),
			this.followingsRepository.exists({
				where: {
					followerId: target,
					followeeId: me,
				},
			}),
			this.followRequestsRepository.exists({
				where: {
					followerId: me,
					followeeId: target,
				},
			}),
			this.followRequestsRepository.exists({
				where: {
					followerId: target,
					followeeId: me,
				},
			}),
			this.blockingsRepository.exists({
				where: {
					blockerId: me,
					blockeeId: target,
				},
			}),
			this.blockingsRepository.exists({
				where: {
					blockerId: target,
					blockeeId: me,
				},
			}),
			this.mutingsRepository.exists({
				where: {
					muterId: me,
					muteeId: target,
				},
			}),
			this.renoteMutingsRepository.exists({
				where: {
					muterId: me,
					muteeId: target,
				},
			}),
		]);

		return {
			id: target,
			following,
			isFollowing: following != null,
			isFollowed,
			hasPendingFollowRequestFromYou,
			hasPendingFollowRequestToYou,
			isBlocking,
			isBlocked,
			isMuted,
			isRenoteMuted,
		};
	}

	@bindThis
	public async getRelations(me: MiUser['id'], targets: MiUser['id'][]): Promise<Map<MiUser['id'], UserRelation>> {
		const [
			followers,
			followees,
			followersRequests,
			followeesRequests,
			blockers,
			blockees,
			muters,
			renoteMuters,
		] = await Promise.all([
			this.followingsRepository.findBy({ followerId: me })
				.then(f => new Map(f.map(it => [it.followeeId, it]))),
			this.followingsRepository.createQueryBuilder('f')
				.select('f.followerId')
				.where('f.followeeId = :me', { me })
				.getRawMany<{ f_followerId: string }>()
				.then(it => it.map(it => it.f_followerId)),
			this.followRequestsRepository.createQueryBuilder('f')
				.select('f.followeeId')
				.where('f.followerId = :me', { me })
				.getRawMany<{ f_followeeId: string }>()
				.then(it => it.map(it => it.f_followeeId)),
			this.followRequestsRepository.createQueryBuilder('f')
				.select('f.followerId')
				.where('f.followeeId = :me', { me })
				.getRawMany<{ f_followerId: string }>()
				.then(it => it.map(it => it.f_followerId)),
			this.blockingsRepository.createQueryBuilder('b')
				.select('b.blockeeId')
				.where('b.blockerId = :me', { me })
				.getRawMany<{ b_blockeeId: string }>()
				.then(it => it.map(it => it.b_blockeeId)),
			this.blockingsRepository.createQueryBuilder('b')
				.select('b.blockerId')
				.where('b.blockeeId = :me', { me })
				.getRawMany<{ b_blockerId: string }>()
				.then(it => it.map(it => it.b_blockerId)),
			this.mutingsRepository.createQueryBuilder('m')
				.select('m.muteeId')
				.where('m.muterId = :me', { me })
				.getRawMany<{ m_muteeId: string }>()
				.then(it => it.map(it => it.m_muteeId)),
			this.renoteMutingsRepository.createQueryBuilder('m')
				.select('m.muteeId')
				.where('m.muterId = :me', { me })
				.getRawMany<{ m_muteeId: string }>()
				.then(it => it.map(it => it.m_muteeId)),
		]);

		return new Map(
			targets.map(target => {
				const following = followers.get(target) ?? null;

				return [
					target,
					{
						id: target,
						following: following,
						isFollowing: following != null,
						isFollowed: followees.includes(target),
						hasPendingFollowRequestFromYou: followersRequests.includes(target),
						hasPendingFollowRequestToYou: followeesRequests.includes(target),
						isBlocking: blockers.includes(target),
						isBlocked: blockees.includes(target),
						isMuted: muters.includes(target),
						isRenoteMuted: renoteMuters.includes(target),
					},
				];
			}),
		);
	}

	@bindThis
	public async getHasUnreadAntenna(userId: MiUser['id']): Promise<boolean> {
		/*
		const myAntennas = (await this.antennaService.getAntennas()).filter(a => a.userId === userId);

		const isUnread = (myAntennas.length > 0 ? await this.antennaNotesRepository.exists({
			where: {
				antennaId: In(myAntennas.map(x => x.id)),
				read: false,
			},
		}) : false);

		return isUnread;
		*/
		return false; // TODO
	}

	@bindThis
	public async getNotificationsInfo(userId: MiUser['id']): Promise<{
		hasUnread: boolean;
		unreadCount: number;
	}> {
		const response = {
			hasUnread: false,
			unreadCount: 0,
		};

		const latestReadNotificationId = await this.redisClient.get(`latestReadNotification:${userId}`);

		if (!latestReadNotificationId) {
			response.unreadCount = await this.redisClient.xlen(`notificationTimeline:${userId}`);
		} else {
			const latestNotificationIdsRes = await this.redisClient.xrevrange(
				`notificationTimeline:${userId}`,
				'+',
				latestReadNotificationId,
			);

			response.unreadCount = (latestNotificationIdsRes.length - 1 >= 0) ? latestNotificationIdsRes.length - 1 : 0;
		}

		if (response.unreadCount > 0) {
			response.hasUnread = true;
		}

		return response;
	}

	@bindThis
	public async getHasPendingReceivedFollowRequest(userId: MiUser['id']): Promise<boolean> {
		const count = await this.followRequestsRepository.countBy({
			followeeId: userId,
		});

		return count > 0;
	}

	@bindThis
	public getOnlineStatus(user: MiUser): 'unknown' | 'online' | 'active' | 'offline' {
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
	public getIdenticonUrl(user: MiUser): string {
		if ((user.host == null || user.host === this.config.host) && user.username.includes('.') && this.meta.iconUrl) { // ローカルのシステムアカウントの場合
			return this.meta.iconUrl;
		} else {
			return `${this.config.url}/identicon/${user.username.toLowerCase()}@${user.host ?? this.config.host}`;
		}
	}

	@bindThis
	public getUserUri(user: MiLocalUser | MiPartialLocalUser | MiRemoteUser | MiPartialRemoteUser): string {
		return this.isRemoteUser(user)
			? user.uri : this.genLocalUserUri(user.id);
	}

	@bindThis
	public genLocalUserUri(userId: string): string {
		return `${this.config.url}/users/${userId}`;
	}

	public async pack<S extends 'MeDetailed' | 'UserDetailedNotMe' | 'UserDetailed' | 'UserLite' = 'UserLite'>(
		src: MiUser['id'] | MiUser,
		me?: { id: MiUser['id']; } | null | undefined,
		options?: {
			schema?: S,
			includeSecrets?: boolean,
			userProfile?: MiUserProfile,
			userRelations?: Map<MiUser['id'], UserRelation>,
			userMemos?: Map<MiUser['id'], string | null>,
			pinNotes?: Map<MiUser['id'], MiUserNotePining[]>,
		},
	): Promise<Packed<S>> {
		const opts = Object.assign({
			schema: 'UserLite',
			includeSecrets: false,
		}, options);

		const user = typeof src === 'object' ? src : await this.usersRepository.findOneByOrFail({ id: src });

		const isDetailed = opts.schema !== 'UserLite';
		const meId = me ? me.id : null;
		const isMe = meId === user.id;
		const iAmModerator = me ? await this.roleService.isModerator(me as MiUser) : false;

		const profile = isDetailed
			? (opts.userProfile ?? await this.userProfilesRepository.findOneByOrFail({ userId: user.id }))
			: null;

		let relation: UserRelation | null = null;
		if (meId && !isMe && isDetailed) {
			if (opts.userRelations) {
				relation = opts.userRelations.get(user.id) ?? null;
			} else {
				relation = await this.getRelation(meId, user.id);
			}
		}

		let memo: string | null = null;
		if (isDetailed && meId) {
			if (opts.userMemos) {
				memo = opts.userMemos.get(user.id) ?? null;
			} else {
				memo = await this.userMemosRepository.findOneBy({ userId: meId, targetUserId: user.id })
					.then(row => row?.memo ?? null);
			}
		}

		let pins: MiUserNotePining[] = [];
		if (isDetailed) {
			if (opts.pinNotes) {
				pins = opts.pinNotes.get(user.id) ?? [];
			} else {
				pins = await this.userNotePiningsRepository.createQueryBuilder('pin')
					.where('pin.userId = :userId', { userId: user.id })
					.innerJoinAndSelect('pin.note', 'note')
					.orderBy('pin.id', 'DESC')
					.getMany();
			}
		}

		const followingCount = profile == null ? null :
			(profile.followingVisibility === 'public') || isMe || iAmModerator ? user.followingCount :
			(profile.followingVisibility === 'followers') && (relation && relation.isFollowing) ? user.followingCount :
			null;

		const followersCount = profile == null ? null :
			(profile.followersVisibility === 'public') || isMe || iAmModerator ? user.followersCount :
			(profile.followersVisibility === 'followers') && (relation && relation.isFollowing) ? user.followersCount :
			null;

		const isModerator = isMe && isDetailed ? this.roleService.isModerator(user) : undefined;
		const isAdmin = isMe && isDetailed ? this.roleService.isAdministrator(user) : undefined;
		const unreadAnnouncements = isMe && isDetailed ?
			(await this.announcementService.getUnreadAnnouncements(user)).map((announcement) => ({
				createdAt: this.idService.parse(announcement.id).date.toISOString(),
				...announcement,
			})) : null;

		const notificationsInfo = isMe && isDetailed ? await this.getNotificationsInfo(user.id) : null;

		// TODO: 例えば avatarUrl: true など間違った型を設定しても型エラーにならないのをどうにかする(ジェネリクス使わない方法で実装するしかなさそう？)
		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: (user.avatarId == null ? null : user.avatarUrl) ?? this.getIdenticonUrl(user),
			avatarBlurhash: (user.avatarId == null ? null : user.avatarBlurhash),
			avatarDecorations: user.avatarDecorations.length > 0 ? this.avatarDecorationService.getAll().then(decorations => user.avatarDecorations.filter(ud => decorations.some(d => d.id === ud.id)).map(ud => ({
				id: ud.id,
				angle: ud.angle || undefined,
				flipH: ud.flipH || undefined,
				offsetX: ud.offsetX || undefined,
				offsetY: ud.offsetY || undefined,
				url: decorations.find(d => d.id === ud.id)!.url,
			}))) : [],
			isBot: user.isBot,
			isCat: user.isCat,
			requireSigninToViewContents: user.requireSigninToViewContents === false ? undefined : true,
			makeNotesFollowersOnlyBefore: user.makeNotesFollowersOnlyBefore ?? undefined,
			makeNotesHiddenBefore: user.makeNotesHiddenBefore ?? undefined,
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
			badgeRoles: user.host == null ? this.roleService.getUserBadgeRoles(user.id).then((rs) => rs
				.filter((r) => r.isPublic || iAmModerator)
				.sort((a, b) => b.displayOrder - a.displayOrder)
				.map((r) => ({
					name: r.name,
					iconUrl: r.iconUrl,
					displayOrder: r.displayOrder,
				})),
			) : undefined,

			...(isDetailed ? {
				url: profile!.url,
				uri: user.uri,
				movedTo: user.movedToUri ? this.apPersonService.resolvePerson(user.movedToUri).then(user => user.id).catch(() => null) : null,
				alsoKnownAs: user.alsoKnownAs
					? Promise.all(user.alsoKnownAs.map(uri => this.apPersonService.fetchPerson(uri).then(user => user?.id).catch(() => null)))
						.then(xs => xs.length === 0 ? null : xs.filter(x => x != null))
					: null,
				createdAt: this.idService.parse(user.id).date.toISOString(),
				updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
				lastFetchedAt: user.lastFetchedAt ? user.lastFetchedAt.toISOString() : null,
				bannerUrl: user.bannerId == null ? null : user.bannerUrl,
				bannerBlurhash: user.bannerId == null ? null : user.bannerBlurhash,
				isLocked: user.isLocked,
				isSilenced: this.roleService.getUserPolicies(user.id).then(r => !r.canPublicNote),
				isSuspended: user.isSuspended,
				description: profile!.description,
				location: profile!.location,
				birthday: profile!.birthday,
				lang: profile!.lang,
				fields: profile!.fields,
				verifiedLinks: profile!.verifiedLinks,
				followersCount: followersCount ?? 0,
				followingCount: followingCount ?? 0,
				notesCount: user.notesCount,
				pinnedNoteIds: pins.map(pin => pin.noteId),
				pinnedNotes: this.noteEntityService.packMany(pins.map(pin => pin.note!), me, {
					detail: true,
				}),
				pinnedPageId: profile!.pinnedPageId,
				pinnedPage: profile!.pinnedPageId ? this.pageEntityService.pack(profile!.pinnedPageId, me) : null,
				publicReactions: this.isLocalUser(user) ? profile!.publicReactions : false, // https://github.com/misskey-dev/misskey/issues/12964
				followersVisibility: profile!.followersVisibility,
				followingVisibility: profile!.followingVisibility,
				chatScope: user.chatScope,
				canChat: this.roleService.getUserPolicies(user.id).then(r => r.chatAvailability === 'available'),
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
				memo: memo,
				moderationNote: iAmModerator ? (profile!.moderationNote ?? '') : undefined,
			} : {}),

			...(isDetailed && (isMe || iAmModerator) ? {
				twoFactorEnabled: profile!.twoFactorEnabled,
				usePasswordLessLogin: profile!.usePasswordLessLogin,
				securityKeys: profile!.twoFactorEnabled
					? this.userSecurityKeysRepository.countBy({ userId: user.id }).then(result => result >= 1)
					: false,
			} : {}),

			...(isDetailed && isMe ? {
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				followedMessage: profile!.followedMessage,
				isModerator: isModerator,
				isAdmin: isAdmin,
				injectFeaturedNote: profile!.injectFeaturedNote,
				receiveAnnouncementEmail: profile!.receiveAnnouncementEmail,
				alwaysMarkNsfw: profile!.alwaysMarkNsfw,
				autoSensitive: profile!.autoSensitive,
				carefulBot: profile!.carefulBot,
				autoAcceptFollowed: profile!.autoAcceptFollowed,
				noCrawle: profile!.noCrawle,
				preventAiLearning: profile!.preventAiLearning,
				isExplorable: user.isExplorable,
				isDeleted: user.isDeleted,
				twoFactorBackupCodesStock: profile?.twoFactorBackupSecret?.length === 5 ? 'full' : (profile?.twoFactorBackupSecret?.length ?? 0) > 0 ? 'partial' : 'none',
				hideOnlineStatus: user.hideOnlineStatus,
				hasUnreadSpecifiedNotes: false, // 後方互換性のため
				hasUnreadMentions: false, // 後方互換性のため
				hasUnreadChatMessages: this.chatService.hasUnreadMessages(user.id),
				hasUnreadAnnouncement: unreadAnnouncements!.length > 0,
				unreadAnnouncements,
				hasUnreadAntenna: this.getHasUnreadAntenna(user.id),
				hasUnreadChannel: false, // 後方互換性のため
				hasUnreadNotification: notificationsInfo?.hasUnread, // 後方互換性のため
				hasPendingReceivedFollowRequest: this.getHasPendingReceivedFollowRequest(user.id),
				unreadNotificationsCount: notificationsInfo?.unreadCount,
				mutedWords: profile!.mutedWords,
				hardMutedWords: profile!.hardMutedWords,
				mutedInstances: profile!.mutedInstances,
				mutingNotificationTypes: [], // 後方互換性のため
				notificationRecieveConfig: profile!.notificationRecieveConfig,
				emailNotificationTypes: profile!.emailNotificationTypes,
				achievements: profile!.achievements,
				loggedInDays: profile!.loggedInDates.length,
				policies: this.roleService.getUserPolicies(user.id),
				// 受け取ったリアクション数を非同期で取得
				receivedReactionsCount: isDetailed ? this.calculateReceivedReactionsCount(user.id).catch(() => 0) : undefined,
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
				notify: relation.following?.notify ?? 'none',
				withReplies: relation.following?.withReplies ?? false,
				followedMessage: relation.isFollowing ? profile!.followedMessage : undefined,
			} : {}),
		} as Promiseable<Packed<S>>;

		return await awaitAll(packed);
	}

	public async packMany<S extends 'MeDetailed' | 'UserDetailedNotMe' | 'UserDetailed' | 'UserLite' = 'UserLite'>(
		users: (MiUser['id'] | MiUser)[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			schema?: S,
			includeSecrets?: boolean,
		},
	): Promise<Packed<S>[]> {
		// -- IDのみの要素を補完して完全なエンティティ一覧を作る

		const _users = users.filter((user): user is MiUser => typeof user !== 'string');
		if (_users.length !== users.length) {
			_users.push(
				...await this.usersRepository.findBy({
					id: In(users.filter((user): user is string => typeof user === 'string')),
				}),
			);
		}
		const _userIds = _users.map(u => u.id);

		// -- 実行者の有無や指定スキーマの種別によって要否が異なる値群を取得

		let profilesMap: Map<MiUser['id'], MiUserProfile> = new Map();
		let userRelations: Map<MiUser['id'], UserRelation> = new Map();
		let userMemos: Map<MiUser['id'], string | null> = new Map();
		let pinNotes: Map<MiUser['id'], MiUserNotePining[]> = new Map();

		if (options?.schema !== 'UserLite') {
			profilesMap = await this.userProfilesRepository.findBy({ userId: In(_userIds) })
				.then(profiles => new Map(profiles.map(p => [p.userId, p])));

			const meId = me ? me.id : null;
			if (meId) {
				userMemos = await this.userMemosRepository.findBy({ userId: meId })
					.then(memos => new Map(memos.map(memo => [memo.targetUserId, memo.memo])));

				if (_userIds.length > 0) {
					userRelations = await this.getRelations(meId, _userIds);
					pinNotes = await this.userNotePiningsRepository.createQueryBuilder('pin')
						.where('pin.userId IN (:...userIds)', { userIds: _userIds })
						.innerJoinAndSelect('pin.note', 'note')
						.getMany()
						.then(pinsNotes => {
							const map = new Map<MiUser['id'], MiUserNotePining[]>();
							for (const note of pinsNotes) {
								const notes = map.get(note.userId) ?? [];
								notes.push(note);
								map.set(note.userId, notes);
							}
							for (const [, notes] of map.entries()) {
								// pack側ではDESCで取得しているので、それに合わせて降順に並び替えておく
								notes.sort((a, b) => b.id.localeCompare(a.id));
							}
							return map;
						});
				}
			}
		}

		return Promise.all(
			_users.map(u => this.pack(
				u,
				me,
				{
					...options,
					userProfile: profilesMap.get(u.id),
					userRelations: userRelations,
					userMemos: userMemos,
					pinNotes: pinNotes,
				},
			)),
		);
	}

	@bindThis
	private calculateNormalizedReactionScore(reactionsCount: number): number {
		// リアクション数を対数スケールで正規化（0-100範囲）
		// log10(リアクション数 + 1) × 20、最大値100に制限
		const score = Math.log10(reactionsCount + 1) * 20;
		return Math.min(Math.floor(score), 100);
	}

	@bindThis
	public async calculateRecentActivityScore(userId: MiUser['id']): Promise<number> {
		// 最近30日間の投稿数を取得し、0-100範囲に正規化
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const thirtyDaysAgoSnowflake = this.idService.gen(thirtyDaysAgo.getTime());
		
		// Misskeyではidにタイムスタンプが含まれているため、idで比較
		const sql = `
			SELECT COUNT(*) as count 
			FROM note 
			WHERE "userId" = $1 AND id >= $2
		`;
		
		const result = await this.usersRepository.query(sql, [userId, thirtyDaysAgoSnowflake]);
		const recentNotes = parseInt(result[0]?.count || '0', 10);
		
		// 30日間の投稿数を0-100範囲に正規化（30投稿で満点）
		return Math.min(Math.floor((recentNotes / 30) * 100), 100);
	}

	@bindThis
	private calculateAccountAgeScore(userId: string): number {
		// アカウント運営期間を0-100範囲に正規化
		const now = new Date();
		const createdDate = this.idService.parse(userId).date;
		const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
		
		// 365日（1年）で満点、最大100に制限
		return Math.min(Math.floor((daysSinceCreation / 365) * 100), 100);
	}

	// アクティビティ減衰係数を計算（lastActiveDateに基づく0.1〜1.0の減衰）
	// 3日以内: 1.0、3日境界で即座に0.5、3-7日: 0.5→0.3、7-14日: 0.3→0.15、14-30日: 0.15→0.1、30日超: 0.1
	// 赤ランプ（3日以上非アクティブ）表示と同時にスコアが即座に半減するようにする
	@bindThis
	private async calculateActivityDecay(userId: MiUser['id']): Promise<number> {
		const user = await this.usersRepository.findOneBy({ id: userId });

		if (!user || !user.lastActiveDate) {
			return 0.1;
		}

		const elapsed = Date.now() - user.lastActiveDate.getTime();

		const ONE_DAY = 1000 * 60 * 60 * 24;
		const THREE_DAYS = ONE_DAY * 3;
		const SEVEN_DAYS = ONE_DAY * 7;
		const FOURTEEN_DAYS = ONE_DAY * 14;
		const THIRTY_DAYS = ONE_DAY * 30;

		if (elapsed < THREE_DAYS) {
			return 1.0;
		} else if (elapsed < SEVEN_DAYS) {
			// 3日で即座に0.5、7日で0.3に到達
			const ratio = (elapsed - THREE_DAYS) / (SEVEN_DAYS - THREE_DAYS);
			return 0.5 - (ratio * 0.2);
		} else if (elapsed < FOURTEEN_DAYS) {
			const ratio = (elapsed - SEVEN_DAYS) / (FOURTEEN_DAYS - SEVEN_DAYS);
			return 0.3 - (ratio * 0.15);
		} else if (elapsed < THIRTY_DAYS) {
			const ratio = (elapsed - FOURTEEN_DAYS) / (THIRTY_DAYS - FOURTEEN_DAYS);
			return 0.15 - (ratio * 0.05);
		} else {
			return 0.1;
		}
	}

	// 人気スコア計算: エンゲージメント比率(重み0.2〜0.7) + フォロワー数(重み0.3〜0.8) にアクティビティ減衰を乗算
	@bindThis
	public async calculatePopularityScore(userId: MiUser['id'], followerCount: number, _notesCount: number): Promise<number> {
		// 30日間のエンゲージメント比率とノート数を取得
		const { ratio: engagementRatio, notesCount: recentNotes } = await this.calculateRecentEngagementRatio(userId);

		// エンゲージメント比率を正規化（0-100範囲、比率10で満点）
		const normalizedEngagement = Math.min(engagementRatio * 10, 100);

		// フォロワー数を正規化（0-100範囲、対数スケール）
		const normalizedFollowers = Math.min(Math.log10(followerCount + 1) * 20, 100);

		// ノート数に応じてエンゲージメント重みを0.2〜0.7の範囲で動的調整
		// 100ノートで最大値(0.7)に到達
		const engagementWeight = Math.min(0.2 + (recentNotes / 100) * 0.5, 0.7);
		const followerWeight = 1 - engagementWeight;

		// 動的重み付けでベーススコア計算
		const baseScore =
			(normalizedEngagement * engagementWeight) +
			(normalizedFollowers * followerWeight);

		// アクティビティ減衰係数を適用（非アクティブユーザーのスコアを低下）
		const activityDecay = await this.calculateActivityDecay(userId);
		const popularityScore = baseScore * activityDecay;

		// 小数点第2位まで保持
		return Math.round(popularityScore * 100) / 100;
	}

	@bindThis
	public async calculateReceivedReactionsCount(userId: MiUser['id']): Promise<number> {
		// ユーザーから受け取ったリアクションの合計数を計算
		const result = await this.usersRepository.query(`
			SELECT SUM(CAST(value AS integer)) as total
			FROM (
				SELECT (jsonb_each_text(reactions)).value
				FROM note
				WHERE "userId" = $1 AND reactions IS NOT NULL
			) subquery
		`, [userId]);

		return parseInt(result[0]?.total || '0', 10);
	}

	@bindThis
	public async calculateRecentReactionsCount(userId: MiUser['id']): Promise<number> {
		// 直近30日間に受け取ったリアクションの合計数を計算
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const thirtyDaysAgoSnowflake = this.idService.gen(thirtyDaysAgo.getTime());

		const result = await this.usersRepository.query(`
			SELECT SUM(CAST(value AS integer)) as total
			FROM (
				SELECT (jsonb_each_text(reactions)).value
				FROM note
				WHERE "userId" = $1
					AND id >= $2
					AND reactions IS NOT NULL
			) subquery
		`, [userId, thirtyDaysAgoSnowflake]);

		return parseInt(result[0]?.total || '0', 10);
	}

	@bindThis
	public async calculateRecentEngagementRatio(userId: MiUser['id']): Promise<{ ratio: number; notesCount: number }> {
		// 直近30日間のエンゲージメント比率（リアクション数/ノート数）を計算
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const thirtyDaysAgoSnowflake = this.idService.gen(thirtyDaysAgo.getTime());

		// 30日間のノート数
		const notesResult = await this.usersRepository.query(`
			SELECT COUNT(*) as count
			FROM note
			WHERE "userId" = $1 AND id >= $2
		`, [userId, thirtyDaysAgoSnowflake]);
		const recentNotes = parseInt(notesResult[0]?.count || '0', 10);

		// ノート数が0の場合は比率0
		if (recentNotes === 0) return { ratio: 0, notesCount: 0 };

		// 30日間のリアクション数
		const reactionsCount = await this.calculateRecentReactionsCount(userId);

		// リアクション/ノート比率
		return { ratio: reactionsCount / recentNotes, notesCount: recentNotes };
	}
}
