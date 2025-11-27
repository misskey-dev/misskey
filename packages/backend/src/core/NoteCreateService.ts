/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import * as mfm from 'mfm-js';
import { In, DataSource, IsNull, LessThan, Not } from 'typeorm';
import * as Redis from 'ioredis';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Data } from 'ws';
import { extractMentions } from '@/misc/extract-mentions.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { MiNote } from '@/models/Note.js';
import type { BlockingsRepository, ChannelFollowingsRepository, ChannelsRepository, DriveFilesRepository, FollowingsRepository, InstancesRepository, MiFollowing, MiMeta, MutingsRepository, NotesRepository, NoteThreadMutingsRepository, UserListMembershipsRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiApp } from '@/models/App.js';
import { concat } from '@/misc/prelude/array.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser, MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { IPoll } from '@/models/Poll.js';
import { MiPoll } from '@/models/Poll.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type { MiChannel } from '@/models/Channel.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { RelayService } from '@/core/RelayService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import NotesChart from '@/core/chart/charts/notes.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { AntennaService } from '@/core/AntennaService.js';
import { QueueService } from '@/core/QueueService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { bindThis } from '@/decorators.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { RoleService } from '@/core/RoleService.js';
import { SearchService } from '@/core/SearchService.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { FanoutTimelineNamePrefix, FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { isReply } from '@/misc/is-reply.js';
import { trackPromise } from '@/misc/promise-tracker.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { CollapsedQueue } from '@/misc/collapsed-queue.js';
import { CacheService } from '@/core/CacheService.js';
import { MetaService } from '@/core/MetaService.js';
import { isQuote, isRenote } from '@/misc/is-renote.js';
import { isPrivateNote, isPrivateNoteInReplyChain } from '@/misc/private-note.js';

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention';

class NotificationManager {
	private notifier: { id: MiUser['id']; };
	private note: MiNote;
	private queue: {
		target: MiLocalUser['id'];
		reason: NotificationType;
	}[];

	constructor(
		private mutingsRepository: MutingsRepository,
		private notificationService: NotificationService,
		notifier: { id: MiUser['id']; },
		note: MiNote,
	) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	@bindThis
	public push(notifiee: MiLocalUser['id'], reason: NotificationType) {
		// 自分自身へは通知しない
		if (this.notifier.id === notifiee) return;

		const exist = this.queue.find(x => x.target === notifiee);

		if (exist) {
			// 「メンションされているかつ返信されている」場合は、メンションとしての通知ではなく返信としての通知にする
			if (reason !== 'mention') {
				exist.reason = reason;
			}
		} else {
			this.queue.push({
				reason: reason,
				target: notifiee,
			});
		}
	}

	@bindThis
	public async notify() {
		for (const x of this.queue) {
			if (x.reason === 'renote') {
				this.notificationService.createNotification(x.target, 'renote', {
					noteId: this.note.id,
					targetNoteId: this.note.renoteId!,
				}, this.notifier.id);
			} else {
				this.notificationService.createNotification(x.target, x.reason, {
					noteId: this.note.id,
				}, this.notifier.id);
			}
		}
	}
}

type MinimumUser = {
	id: MiUser['id'];
	host: MiUser['host'];
	username: MiUser['username'];
	uri: MiUser['uri'];
};

type Option = {
	createdAt?: Date | null;
	name?: string | null;
	text?: string | null;
	reply?: MiNote | null;
	renote?: MiNote | null;
	files?: MiDriveFile[] | null;
	poll?: IPoll | null;
	localOnly?: boolean | null;
	isNoteInYamiMode?: boolean | null;
	reactionAcceptance?: MiNote['reactionAcceptance'];
	cw?: string | null;
	visibility?: string;
	visibleUsers?: MinimumUser[] | null;
	channel?: MiChannel | null;
	apMentions?: MinimumUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	uri?: string | null;
	url?: string | null;
	app?: MiApp | null;
	deleteAt?: Date | null;
};

@Injectable()
export class NoteCreateService implements OnApplicationShutdown {
	#shutdownController = new AbortController();
	private updateNotesCountQueue: CollapsedQueue<MiNote['id'], number>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private queueService: QueueService,
		private fanoutTimelineService: FanoutTimelineService,
		private notificationService: NotificationService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
		private hashtagService: HashtagService,
		private antennaService: AntennaService,
		private webhookService: UserWebhookService,
		private featuredService: FeaturedService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apDeliverManagerService: ApDeliverManagerService,
		private apRendererService: ApRendererService,
		private roleService: RoleService,
		private searchService: SearchService,
		private notesChart: NotesChart,
		private perUserNotesChart: PerUserNotesChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private utilityService: UtilityService,
		private userBlockingService: UserBlockingService,
		private cacheService: CacheService,
		private metaService: MetaService,
	) {
		this.updateNotesCountQueue = new CollapsedQueue(process.env.NODE_ENV !== 'test' ? 60 * 1000 * 5 : 0, this.collapseNotesCount, this.performUpdateNotesCount);
	}

	@bindThis
	public async fetchAndCreate(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
		isCat: MiUser['isCat'];
	}, data: {
		createdAt: Date;
		replyId: MiNote['id'] | null;
		renoteId: MiNote['id'] | null;
		fileIds: MiDriveFile['id'][];
		text: string | null;
		cw: string | null;
		visibility: string;
		visibleUserIds: MiUser['id'][];
		channelId: MiChannel['id'] | null;
		localOnly: boolean;
		reactionAcceptance: MiNote['reactionAcceptance'];
		poll: IPoll | null;
		isNoteInYamiMode?: boolean;
		deleteAt?: Date | null;
		apMentions?: MinimumUser[] | null;
		apHashtags?: string[] | null;
		apEmojis?: string[] | null;
	}): Promise<MiNote> {
		const visibleUsers = data.visibleUserIds.length > 0 ? await this.usersRepository.findBy({
			id: In(data.visibleUserIds),
		}) : [];

		let files: MiDriveFile[] = [];
		if (data.fileIds.length > 0) {
			files = await this.driveFilesRepository.createQueryBuilder('file')
				.where('file.userId = :userId AND file.id IN (:...fileIds)', {
					userId: user.id,
					fileIds: data.fileIds,
				})
				.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
				.setParameters({ fileIds: data.fileIds })
				.getMany();

			if (files.length !== data.fileIds.length) {
				throw new IdentifiableError('801c046c-5bf5-4234-ad2b-e78fc20a2ac7', 'No such file');
			}
		}

		let renote: MiNote | null = null;
		if (data.renoteId != null) {
			// Fetch renote to note
			renote = await this.notesRepository.findOne({
				where: { id: data.renoteId },
				relations: ['user', 'renote', 'reply'],
			});

			if (renote == null) {
				throw new IdentifiableError('53983c56-e163-45a6-942f-4ddc485d4290', 'No such renote target');
			} else if (isRenote(renote) && !isQuote(renote)) {
				throw new IdentifiableError('bde24c37-121f-4e7d-980d-cec52f599f02', 'Cannot renote pure renote');
			}

			// Check blocking
			if (renote.userId !== user.id) {
				const blockExist = await this.blockingsRepository.exists({
					where: {
						blockerId: renote.userId,
						blockeeId: user.id,
					},
				});
				if (blockExist) {
					throw new IdentifiableError('2b4fe776-4414-4a2d-ae39-f3418b8fd4d3', 'You have been blocked by the user');
				}
			}

			if (renote.visibility === 'followers' && renote.userId !== user.id) {
				// 他人のfollowers noteはreject
				throw new IdentifiableError('90b9d6f0-893a-4fef-b0f1-e9a33989f71a', 'Renote target visibility');
			} else if (renote.visibility === 'specified') {
				// specified / direct noteはreject
				throw new IdentifiableError('48d7a997-da5c-4716-b3c3-92db3f37bf7d', 'Renote target visibility');
			}

			if (renote.channelId && renote.channelId !== data.channelId) {
				// チャンネルのノートに対しリノート要求がきたとき、チャンネル外へのリノート可否をチェック
				// リノートのユースケースのうち、チャンネル内→チャンネル外は少数だと考えられるため、JOINはせず必要な時に都度取得する
				const renoteChannel = await this.channelsRepository.findOneBy({ id: renote.channelId });
				if (renoteChannel == null) {
					// リノートしたいノートが書き込まれているチャンネルが無い
					throw new IdentifiableError('b060f9a6-8909-4080-9e0b-94d9fa6f6a77', 'No such channel');
				} else if (!renoteChannel.allowRenoteToExternal) {
					// リノート作成のリクエストだが、対象チャンネルがリノート禁止だった場合
					throw new IdentifiableError('7e435f4a-780d-4cfc-a15a-42519bd6fb67', 'Channel does not allow renote to external');
				}
			}
		}

		let reply: MiNote | null = null;
		if (data.replyId != null) {
			// Fetch reply
			reply = await this.notesRepository.findOne({
				where: { id: data.replyId },
				relations: ['user'],
			});

			if (reply == null) {
				throw new IdentifiableError('60142edb-1519-408e-926d-4f108d27bee0', 'No such reply target');
			} else if (isRenote(reply) && !isQuote(reply)) {
				throw new IdentifiableError('f089e4e2-c0e7-4f60-8a23-e5a6bf786b36', 'Cannot reply to pure renote');
			} else if (!await this.noteEntityService.isVisibleForMe(reply, user.id)) {
				throw new IdentifiableError('11cd37b3-a411-4f77-8633-c580ce6a8dce', 'No such reply target');
			} else if (reply.visibility === 'specified' && data.visibility !== 'specified') {
				throw new IdentifiableError('ced780a1-2012-4caf-bc7e-a95a291294cb', 'Cannot reply to specified note with different visibility');
			}

			// Check blocking
			if (reply.userId !== user.id) {
				const blockExist = await this.blockingsRepository.exists({
					where: {
						blockerId: reply.userId,
						blockeeId: user.id,
					},
				});
				if (blockExist) {
					throw new IdentifiableError('b0df6025-f2e8-44b4-a26a-17ad99104612', 'You have been blocked by the user');
				}
			}
		}

		if (data.poll) {
			if (data.poll.expiresAt != null) {
				if (data.poll.expiresAt.getTime() < Date.now()) {
					throw new IdentifiableError('0c11c11e-0c8d-48e7-822c-76ccef660068', 'Poll expiration must be future time');
				}
			}
		}

		let channel: MiChannel | null = null;
		if (data.channelId != null) {
			channel = await this.channelsRepository.findOneBy({ id: data.channelId, isArchived: false });

			if (channel == null) {
				throw new IdentifiableError('bfa3905b-25f5-4894-b430-da331a490e4b', 'No such channel');
			}
		}

		return this.create(user, {
			createdAt: data.createdAt,
			files: files,
			poll: data.poll,
			text: data.text,
			reply,
			renote,
			cw: data.cw,
			localOnly: data.localOnly,
			reactionAcceptance: data.reactionAcceptance,
			visibility: data.visibility,
			visibleUsers,
			channel,
			isNoteInYamiMode: data.isNoteInYamiMode,
			deleteAt: data.deleteAt,
			apMentions: data.apMentions,
			apHashtags: data.apHashtags,
			apEmojis: data.apEmojis,
		});
	}

	@bindThis
	public async create(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
		isCat: MiUser['isCat'];
	}, data: Option, silent = false): Promise<MiNote> {
		// リプライ先がプライベートノートチェーンの場合、自動的にプライベート設定を適用
		if (data.reply) {
			const isReplyToPrivateChain = await isPrivateNoteInReplyChain(data.reply, this.notesRepository);
			if (isReplyToPrivateChain) {
				// DMリプライ（複数人宛）の場合は既存の宛先を保持
				// プライベートノートへのリプライの場合のみ自分のみに設定
				if (!data.visibleUsers || data.visibleUsers.length === 0) {
					data.visibility = 'specified';
					data.visibleUsers = []; // 自分のみ閲覧可能に設定
					data.localOnly = true; // 連合なし強制
				}
			}
		}

		// チャンネル投稿は常に非やみノート（やみTLとの分離）
		if (data.channel) {
			data.isNoteInYamiMode = false;
		} else if (data.isNoteInYamiMode == null) {
			// リプライ先またはリノート元がやみノートの場合は強制的にやみノート
			if ((data.reply && data.reply.isNoteInYamiMode) ||
				(data.renote && data.renote.isNoteInYamiMode)) {
				data.isNoteInYamiMode = true;
			} else {
				// publicityと同様に扱う - 明示的に指定がなければデフォルトは非やみノート
				data.isNoteInYamiMode = false;
			}
		}

		// やみノート投稿時のチェック
		if (data.isNoteInYamiMode) {
			// 重要: やみノートの場合、サーバー設定を確認して連合を強制的に制御
			const yamiMeta = await this.metaService.fetch();
			if (!yamiMeta.yamiNoteFederationEnabled) {
				// 連合が無効な場合は強制的にローカルオンリーに
				data.localOnly = true;
			}

			// リモートユーザーとローカルユーザーで分岐
			if (user.host !== null) {
				// リモートユーザーの場合: 信頼済みインスタンスのみチェック
				const trustedHosts = yamiMeta.yamiNoteFederationTrustedInstances || [];
				const isTrusted = trustedHosts.some(trusted =>
					user.host === trusted || user.host?.endsWith(`.${trusted}`),
				);

				if (!isTrusted) {
					throw new Error('You do not have permission to post yami notes: Remote user from untrusted instance');
				}
			} else {
				// ローカルユーザーの場合: ロール権限をチェック
				const policies = await this.roleService.getUserPolicies(user.id);
				if (!policies.canYamiNote) {
					throw new Error('You do not have permission to post yami notes: Local user without necessary role permission');
				}
			}

			// 重要: やみノートの場合、サーバー設定を確認して連合を強制的に制御
			const meta = await this.metaService.fetch();
			if (!meta.yamiNoteFederationEnabled) {
				// 連合が無効な場合は強制的にローカルオンリーに
				data.localOnly = true;
			}
		}

		// チャンネル外にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && data.channel && data.reply.channelId !== data.channel.id) {
			if (data.reply.channelId) {
				data.channel = await this.channelsRepository.findOneBy({ id: data.reply.channelId });
			} else {
				data.channel = null;
			}
		}

		// チャンネル内にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && (data.channel == null) && data.reply.channelId) {
			data.channel = await this.channelsRepository.findOneBy({ id: data.reply.channelId });
		}

		if (data.createdAt == null) data.createdAt = new Date();
		if (data.visibility == null) data.visibility = 'public';
		if (data.localOnly == null) data.localOnly = false;
		if (data.channel != null) data.visibility = 'public';
		if (data.channel != null) data.visibleUsers = [];
		if (data.channel != null) data.localOnly = true;

		// 連合権限のチェック - ローカルオンリーでない場合に権限を確認
		if (data.localOnly === false) {
			const policies = await this.roleService.getUserPolicies(user.id);
			if (policies.canFederateNote === false) {
				data.localOnly = true; // 連合権限がない場合は強制的にローカルオンリーに
			}
		}

		// プライベートノート（自分のみ閲覧可能）の場合は連合なし強制
		if (isPrivateNote({
			visibility: data.visibility,
			visibleUserIds: data.visibleUsers ? data.visibleUsers.map(u => u.id) : [],
			userId: user.id,
		})) {
			data.localOnly = true;
		}

		if (data.visibility === 'public' && data.channel == null) {
			const sensitiveWords = this.meta.sensitiveWords;
			if (this.utilityService.isKeyWordIncluded(data.cw ?? data.text ?? '', sensitiveWords)) {
				data.visibility = 'home';
			} else if ((await this.roleService.getUserPolicies(user.id)).canPublicNote === false) {
				data.visibility = 'home';
			}
		}

		const hasProhibitedWords = this.checkProhibitedWordsContain({
			cw: data.cw,
			text: data.text,
			pollChoices: data.poll?.choices,
		}, this.meta.prohibitedWords);

		if (hasProhibitedWords) {
			throw new IdentifiableError('689ee33f-f97c-479a-ac49-1b9f8140af99', 'Note contains prohibited words');
		}

		const inSilencedInstance = this.utilityService.isSilencedHost(this.meta.silencedHosts, user.host);

		if (data.visibility === 'public' && inSilencedInstance && user.host !== null) {
			data.visibility = 'home';
		}

		if (data.renote) {
			// 連合ありやみノートのリノートを禁止
			if (data.renote.isNoteInYamiMode && !data.renote.localOnly) {
				throw new Error('Renote of federated yami note is not allowed');
			}

			switch (data.renote.visibility) {
				case 'public':
					// public noteは無条件にrenote可能（ただし連合ありやみノートは上でブロック済み）
					break;
				case 'home':
					// home noteはhome以下にrenote可能
					if (data.visibility === 'public') {
						data.visibility = 'home';
					}
					break;
				case 'followers':
					// 他人のfollowers noteはreject
					if (data.renote.userId !== user.id) {
						throw new Error('Renote target is not public or home');
					}

					// Renote対象がfollowersならfollowersにする
					data.visibility = 'followers';
					break;
				case 'specified':
					// specified / direct noteはreject
					throw new Error('Renote target is not public or home');
			}
		}

		// Check blocking
		if (this.isRenote(data) && !this.isQuote(data)) {
			if (data.renote.userHost === null) {
				if (data.renote.userId !== user.id) {
					const blocked = await this.userBlockingService.checkBlocked(data.renote.userId, user.id);
					if (blocked) {
						throw new Error('blocked');
					}
				}
			}
		}

		// 返信対象がpublicではないならhomeにする
		if (data.reply && data.reply.visibility !== 'public' && data.visibility === 'public') {
			data.visibility = 'home';
		}

		// ローカルのみをRenoteしたらローカルのみにする
		if (data.renote && data.renote.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		// ローカルのみにリプライしたらローカルのみにする
		if (data.reply && data.reply.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		if (data.text) {
			if (data.text.length > DB_MAX_NOTE_TEXT_LENGTH) {
				data.text = data.text.slice(0, DB_MAX_NOTE_TEXT_LENGTH);
			}
			data.text = data.text.trim();
			if (data.text === '') {
				data.text = null;
			}
		} else {
			data.text = null;
		}

		let tags = data.apHashtags;
		let emojis = data.apEmojis;
		let mentionedUsers = data.apMentions;

		// Parse MFM if needed
		if (!tags || !emojis || !mentionedUsers) {
			const tokens = (data.text ? mfm.parse(data.text)! : []);
			const cwTokens = data.cw ? mfm.parse(data.cw)! : [];
			const choiceTokens = data.poll && data.poll.choices
				? concat(data.poll.choices.map(choice => mfm.parse(choice)!))
				: [];

			const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

			tags = data.apHashtags ?? extractHashtags(combinedTokens);

			emojis = data.apEmojis ?? extractCustomEmojisFromMfm(combinedTokens);

			mentionedUsers = data.apMentions ?? await this.extractMentionedUsers(user, combinedTokens);
		}

		// if the host is media-silenced, custom emojis are not allowed
		if (this.utilityService.isMediaSilencedHost(this.meta.mediaSilencedHosts, user.host)) emojis = [];

		tags = tags.filter(tag => Array.from(tag).length <= 128).splice(0, 32);

		if (data.reply && (user.id !== data.reply.userId) && !mentionedUsers.some(u => u.id === data.reply!.userId)) {
			mentionedUsers.push(await this.usersRepository.findOneByOrFail({ id: data.reply!.userId }));
		}

		if (data.visibility === 'specified') {
			if (data.visibleUsers == null) throw new Error('invalid param');

			for (const u of data.visibleUsers) {
				if (!mentionedUsers.some(x => x.id === u.id)) {
					mentionedUsers.push(u);
				}
			}

			if (data.reply && !data.visibleUsers.some(x => x.id === data.reply!.userId)) {
				data.visibleUsers.push(await this.usersRepository.findOneByOrFail({ id: data.reply!.userId }));
			}
		}

		if (mentionedUsers.length > 0 && mentionedUsers.length > (await this.roleService.getUserPolicies(user.id)).mentionLimit) {
			throw new IdentifiableError('9f466dab-c856-48cd-9e65-ff90ff750580', 'Note contains too many mentions');
		}

		const note = await this.insertNote(user, data, tags, emojis, mentionedUsers);

		setImmediate('post created', { signal: this.#shutdownController.signal }).then(
			() => this.postNoteCreated(note, user, data, silent, tags!, mentionedUsers!),
			() => { /* aborted, ignore this */ },
		);

		return note;
	}

	@bindThis
	public async import(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
	}, data: Option, silent = false): Promise<MiNote> {
		// チャンネル外にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && data.channel && data.reply.channelId !== data.channel.id) {
			if (data.reply.channelId) {
				data.channel = await this.channelsRepository.findOneBy({ id: data.reply.channelId });
			} else {
				data.channel = null;
			}
		}

		if (data.isNoteInYamiMode) {
			throw new IdentifiableError('cb4feb26-a6e8-44b4-8c9d-d21c48a73d93', 'Unable to re-import notes created in yamisskey.');
		} else {
			data.isNoteInYamiMode = false;
		}

		// チャンネル内にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && (data.channel == null) && data.reply.channelId) {
			data.channel = await this.channelsRepository.findOneBy({ id: data.reply.channelId });
		}

		if (data.createdAt == null) data.createdAt = new Date();
		if (data.visibility == null) data.visibility = 'public';
		if (data.localOnly == null) data.localOnly = false;
		if (data.channel != null) data.visibility = 'public';
		if (data.channel != null) data.visibleUsers = [];
		if (data.channel != null) data.localOnly = true;

		// プライベートノート（自分のみ閲覧可能）の場合は連合なし強制
		if (isPrivateNote({
			visibility: data.visibility,
			visibleUserIds: data.visibleUsers ? data.visibleUsers.map(u => u.id) : [],
			userId: user.id,
		})) {
			data.localOnly = true;
		}

		// 連合権限のチェック - ローカルオンリーでない場合に権限を確認
		if (data.localOnly === false) {
			const policies = await this.roleService.getUserPolicies(user.id);
			if (policies.canFederateNote === false) {
				data.localOnly = true; // 連合権限がない場合は強制的にローカルオンリーに
			}
		}

		const meta = await this.metaService.fetch();

		if (data.visibility === 'public' && data.channel == null) {
			const sensitiveWords = meta.sensitiveWords;
			if (this.utilityService.isKeyWordIncluded(data.cw ?? data.text ?? '', sensitiveWords)) {
				data.visibility = 'home';
			} else if ((await this.roleService.getUserPolicies(user.id)).canPublicNote === false) {
				data.visibility = 'home';
			}
		}

		const hasProhibitedWords = await this.checkProhibitedWordsContain({
			cw: data.cw,
			text: data.text,
			pollChoices: data.poll?.choices,
		}, meta.prohibitedWords);

		if (hasProhibitedWords) {
			throw new IdentifiableError('689ee33f-f97c-479a-ac49-1b9f8140af99', 'Note contains prohibited words');
		}

		const inSilencedInstance = this.utilityService.isSilencedHost(meta.silencedHosts, user.host);

		if (data.visibility === 'public' && inSilencedInstance && user.host !== null) {
			data.visibility = 'home';
		}

		if (data.renote) {
			// 連合ありやみノートのリノートを禁止
			if (data.renote.isNoteInYamiMode && !data.renote.localOnly) {
				throw new Error('Renote of federated yami note is not allowed');
			}

			switch (data.renote.visibility) {
				case 'public':
					// public noteは無条件にrenote可能（ただし連合ありやみノートは上でブロック済み）
					break;
				case 'home':
					// home noteはhome以下にrenote可能
					if (data.visibility === 'public') {
						data.visibility = 'home';
					}
					break;
				case 'followers':
					// 他人のfollowers noteはreject
					if (data.renote.userId !== user.id) {
						throw new Error('Renote target is not public or home');
					}

					// Renote対象がfollowersならfollowersにする
					data.visibility = 'followers';
					break;
				case 'specified':
					// specified / direct noteはreject
					throw new Error('Renote target is not public or home');
			}
		}

		// Check blocking
		if (data.renote && data.text == null && data.poll == null && (data.files == null || data.files.length === 0)) {
			if (data.renote.userHost === null) {
				if (data.renote.userId !== user.id) {
					const blocked = await this.userBlockingService.checkBlocked(data.renote.userId, user.id);
					if (blocked) {
						throw new Error('blocked');
					}
				}
			}
		}

		// 返信対象がpublicではないならhomeにする
		if (data.reply && data.reply.visibility !== 'public' && data.visibility === 'public') {
			data.visibility = 'home';
		}

		// ローカルのみをRenoteしたらローカルのみにする
		if (data.renote && data.renote.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		// ローカルのみにリプライしたらローカルのみにする
		if (data.reply && data.reply.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		if (data.text) {
			if (data.text.length > DB_MAX_NOTE_TEXT_LENGTH) {
				data.text = data.text.slice(0, DB_MAX_NOTE_TEXT_LENGTH);
			}
			data.text = data.text.trim();
		} else {
			data.text = null;
		}

		let tags = data.apHashtags;
		let emojis = data.apEmojis;
		let mentionedUsers = data.apMentions;

		// Parse MFM if needed
		if (!tags || !emojis || !mentionedUsers) {
			const tokens = (data.text ? mfm.parse(data.text)! : []);
			const cwTokens = data.cw ? mfm.parse(data.cw)! : [];
			const choiceTokens = data.poll && data.poll.choices
				? concat(data.poll.choices.map(choice => mfm.parse(choice)!))
				: [];

			const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

			tags = data.apHashtags ?? extractHashtags(combinedTokens);

			emojis = data.apEmojis ?? extractCustomEmojisFromMfm(combinedTokens);

			mentionedUsers = data.apMentions ?? await this.extractMentionedUsers(user, combinedTokens);
		}

		tags = tags.filter(tag => Array.from(tag).length <= 128).splice(0, 32);

		if (data.reply && (user.id !== data.reply.userId) && !mentionedUsers.some(u => u.id === data.reply!.userId)) {
			mentionedUsers.push(await this.usersRepository.findOneByOrFail({ id: data.reply!.userId }));
		}

		if (data.visibility === 'specified') {
			if (data.visibleUsers == null) throw new Error('invalid param');

			for (const u of data.visibleUsers) {
				if (!mentionedUsers.some(x => x.id === u.id)) {
					mentionedUsers.push(u);
				}
			}

			if (data.reply && !data.visibleUsers.some(x => x.id === data.reply!.userId)) {
				data.visibleUsers.push(await this.usersRepository.findOneByOrFail({ id: data.reply!.userId }));
			}
		}

		const note = await this.insertNote(user, data, tags, emojis, mentionedUsers);

		setImmediate('post created', { signal: this.#shutdownController.signal }).then(
			() => this.postNoteImported(note, user, data, silent, tags!, mentionedUsers!),
			() => { /* aborted, ignore this */ },
		);

		return note;
	}

	@bindThis
	private async insertNote(user: { id: MiUser['id']; host: MiUser['host']; }, data: Option, tags: string[], emojis: string[], mentionedUsers: MinimumUser[]) {
		if (data.createdAt) {
			if (data.createdAt.getTime() > Date.now() + 1000 * 60 * 3) {
				throw new Error('Invalid createdAt time: Time is more than 3 minutes ahead of the current time.');
			}
		}

		const insert = new MiNote({
			id: this.idService.gen(data.createdAt?.getTime()),
			fileIds: data.files ? data.files.map(file => file.id) : [],
			replyId: data.reply ? data.reply.id : null,
			renoteId: data.renote ? data.renote.id : null,
			channelId: data.channel ? data.channel.id : null,
			threadId: data.reply
				? data.reply.threadId
					? data.reply.threadId
					: data.reply.id
				: null,
			name: data.name,
			text: data.text,
			hasPoll: data.poll != null,
			deleteAt: data.deleteAt,
			cw: data.cw ?? null,
			tags: tags.map(tag => normalizeForSearch(tag)),
			emojis,
			userId: user.id,
			localOnly: data.localOnly!,
			isNoteInYamiMode: data.isNoteInYamiMode!,
			reactionAcceptance: data.reactionAcceptance ?? null,
			visibility: data.visibility as any,
			visibleUserIds: data.visibility === 'specified'
				? data.visibleUsers
					? data.visibleUsers.map(u => u.id)
					: []
				: [],

			attachedFileTypes: data.files ? data.files.map(file => file.type) : [],

			// 以下非正規化データ
			replyUserId: data.reply ? data.reply.userId : null,
			replyUserHost: data.reply ? data.reply.userHost : null,
			renoteUserId: data.renote ? data.renote.userId : null,
			renoteUserHost: data.renote ? data.renote.userHost : null,
			renoteChannelId: data.renote ? data.renote.channelId : null,
			userHost: user.host,
		});

		if (data.uri != null) insert.uri = data.uri;
		if (data.url != null) insert.url = data.url;

		// Append mentions data
		if (mentionedUsers.length > 0) {
			insert.mentions = mentionedUsers.map(u => u.id);
			const profiles = await this.userProfilesRepository.findBy({ userId: In(insert.mentions) });
			insert.mentionedRemoteUsers = JSON.stringify(mentionedUsers.filter(u => this.userEntityService.isRemoteUser(u)).map(u => {
				const profile = profiles.find(p => p.userId === u.id);
				const url = profile != null ? profile.url : null;
				return {
					uri: u.uri,
					url: url ?? undefined,
					username: u.username,
					host: u.host,
				} as IMentionedRemoteUsers[0];
			}));
		}

		// 投稿を作成
		try {
			if (insert.hasPoll) {
				// Start transaction
				await this.db.transaction(async transactionalEntityManager => {
					await transactionalEntityManager.insert(MiNote, insert);

					const poll = new MiPoll({
						noteId: insert.id,
						choices: data.poll!.choices,
						expiresAt: data.poll!.expiresAt,
						multiple: data.poll!.multiple,
						votes: new Array(data.poll!.choices.length).fill(0),
						noteVisibility: insert.visibility,
						userId: user.id,
						userHost: user.host,
						channelId: insert.channelId,
					});

					await transactionalEntityManager.insert(MiPoll, poll);
				});
			} else {
				await this.notesRepository.insert(insert);
			}

			return {
				...insert,
				reply: data.reply ?? null,
				renote: data.renote ?? null,
			};
		} catch (e) {
			// duplicate key error
			if (isDuplicateKeyValueError(e)) {
				const err = new Error('Duplicated note');
				err.name = 'duplicated';
				throw err;
			}

			console.error(e);

			throw e;
		}
	}

	@bindThis
	private async postNoteCreated(note: MiNote, user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
	}, data: Option, silent: boolean, tags: string[], mentionedUsers: MinimumUser[]) {
		this.notesChart.update(note, true);
		if (note.visibility !== 'specified' && (this.meta.enableChartsForRemoteUser || (user.host == null))) {
			this.perUserNotesChart.update(user, note, true);
		}

		// Register host
		if (this.meta.enableStatsForFederatedInstances) {
			if (this.userEntityService.isRemoteUser(user)) {
				this.federatedInstanceService.fetchOrRegister(user.host).then(async i => {
					this.updateNotesCountQueue.enqueue(i.id, 1);
					if (this.meta.enableChartsForFederatedInstances) {
						this.instanceChart.updateNote(i.host, note, true);
					}
				});
			}
		}

		// ハッシュタグ更新
		if (data.visibility === 'public' || data.visibility === 'home') {
			this.hashtagService.updateHashtags(user, tags);
		}

		// Increment notes count (user)
		this.incNotesCountOfUser(user);

		// やみノートもしくは通常ノートのタイムライン処理
		if (!silent) {
			// タイムラインへのファンアウト
			this.pushToTl(note, user);
		}

		// アンテナへの追加など、以下の処理は共通
		this.antennaService.addNoteToAntennas({
			...note,
			channel: data.channel ?? null,
		}, user);

		if (data.reply) {
			this.saveReply(data.reply, note);
		}

		if (data.reply == null) {
			// TODO: キャッシュ
			this.followingsRepository.findBy({
				followeeId: user.id,
				notify: 'normal',
			}).then(async followings => {
				if (note.visibility !== 'specified') {
					const isPureRenote = this.isRenote(data) && !this.isQuote(data) ? true : false;
					for (const following of followings) {
						// TODO: ワードミュート考慮
						let isRenoteMuted = false;
						if (isPureRenote) {
							const userIdsWhoMeMutingRenotes = await this.cacheService.renoteMutingsCache.fetch(following.followerId);
							isRenoteMuted = userIdsWhoMeMutingRenotes.has(user.id);
						}
						if (!isRenoteMuted) {
							this.notificationService.createNotification(following.followerId, 'note', {
								noteId: note.id,
							}, user.id);
						}
					}
				}
			});
		}

		if (data.renote && data.renote.userId !== user.id && !user.isBot) {
			this.incRenoteCount(data.renote);
		}

		if (data.poll && data.poll.expiresAt) {
			const delay = data.poll.expiresAt.getTime() - Date.now();
			this.queueService.endedPollNotificationQueue.add(note.id, {
				noteId: note.id,
			}, {
				delay,
				removeOnComplete: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 30,
				},
				removeOnFail: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 100,
				},
			});
		}

		if (data.deleteAt) {
			const delay = data.deleteAt.getTime() - Date.now();
			this.queueService.scheduledNoteDeleteQueue.add(note.id, {
				noteId: note.id,
			}, {
				delay,
				removeOnComplete: true,
			});
		}

		if (!silent) {
			if (this.userEntityService.isLocalUser(user)) this.activeUsersChart.write(user);

			// Pack the note
			const noteObj = await this.noteEntityService.pack(note, null, { skipHide: true, withReactionAndUserPairCache: true });

			this.globalEventService.publishNotesStream(noteObj);

			this.roleService.addNoteToRoleTimeline(noteObj);

			this.webhookService.enqueueUserWebhook(user.id, 'note', { note: noteObj });

			const nm = new NotificationManager(this.mutingsRepository, this.notificationService, user, note);

			await this.createMentionedEvents(mentionedUsers, note, nm);

			// If has in reply to note
			if (data.reply) {
				// 通知
				if (data.reply.userHost === null) {
					const isThreadMuted = await this.noteThreadMutingsRepository.exists({
						where: {
							userId: data.reply.userId,
							threadId: data.reply.threadId ?? data.reply.id,
						},
					});

					if (!isThreadMuted) {
						nm.push(data.reply.userId, 'reply');
						this.globalEventService.publishMainStream(data.reply.userId, 'reply', noteObj);
						this.webhookService.enqueueUserWebhook(data.reply.userId, 'reply', { note: noteObj });
					}
				}
			}

			// If it is renote
			if (this.isRenote(data)) {
				const type = this.isQuote(data) ? 'quote' : 'renote';

				// Notify
				if (data.renote.userHost === null) {
					nm.push(data.renote.userId, type);
				}

				// Publish event
				if ((user.id !== data.renote.userId) && data.renote.userHost === null) {
					this.globalEventService.publishMainStream(data.renote.userId, 'renote', noteObj);
					this.webhookService.enqueueUserWebhook(data.renote.userId, 'renote', { note: noteObj });
				}
			}

			nm.notify();

			//#region AP deliver
			if (!data.localOnly && this.userEntityService.isLocalUser(user)) {
				(async () => {
					const noteActivity = await this.renderNoteOrRenoteActivity(data, note);
					const dm = this.apDeliverManagerService.createDeliverManager(user, noteActivity);

					// やみノートの場合は配送先制限処理
					if (note.isNoteInYamiMode) {
						await this.deliverYamiNote(note, user, dm);
						return; // やみノート処理完了後は他の配送をしない
					}

					// 以下、通常ノートの配送処理
					// メンションされたリモートユーザーに配送
					for (const u of mentionedUsers.filter(u => this.userEntityService.isRemoteUser(u))) {
						dm.addDirectRecipe(u as MiRemoteUser);
					}

					// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
					if (data.reply && data.reply.userHost !== null) {
						const u = await this.usersRepository.findOneBy({ id: data.reply.userId });
						if (u && this.userEntityService.isRemoteUser(u)) dm.addDirectRecipe(u);
					}

					// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
					if (data.renote && data.renote.userHost !== null) {
						const u = await this.usersRepository.findOneBy({ id: data.renote.userId });
						if (u && this.userEntityService.isRemoteUser(u)) dm.addDirectRecipe(u);
					}

					// フォロワーに配送
					if (['public', 'home', 'followers'].includes(note.visibility)) {
						dm.addFollowersRecipe();
					}

					if (['public'].includes(note.visibility)) {
						this.relayService.deliverToRelays(user, noteActivity);
					}

					trackPromise(dm.execute());
				})();
			}
			//#endregion
		}

		if (data.channel) {
			this.channelsRepository.increment({ id: data.channel.id }, 'notesCount', 1);
			this.channelsRepository.update(data.channel.id, {
				lastNotedAt: new Date(),
			});

			this.notesRepository.countBy({
				userId: user.id,
				channelId: data.channel.id,
			}).then(count => {
				// この処理が行われるのはノート作成後なので、ノートが一つしかなかったら最初の投稿だと判断できる
				// TODO: とはいえノートを削除して何回も投稿すればその分だけインクリメントされる雑さもあるのでどうにかしたい
				if (count === 1) {
					this.channelsRepository.increment({ id: data.channel!.id }, 'usersCount', 1);
				}
			});
		}

		// Register to search database
		this.index(note);
	}

	@bindThis
	private async postNoteImported(note: MiNote, user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
	}, data: Option, silent: boolean, tags: string[], mentionedUsers: MinimumUser[]) {
		const meta = await this.metaService.fetch();

		this.notesChart.update(note, true);
		if (note.visibility !== 'specified' && (meta.enableChartsForRemoteUser || (user.host == null))) {
			this.perUserNotesChart.update(user, note, true);
		}

		// Register host
		if (this.userEntityService.isRemoteUser(user)) {
			this.federatedInstanceService.fetch(user.host).then(async i => {
				if (!i) return;
				if (note.renote && note.text) {
					this.instancesRepository.increment({ id: i.id }, 'notesCount', 1);
				} else if (!note.renote) {
					this.instancesRepository.increment({ id: i.id }, 'notesCount', 1);
				}
				if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
					this.instanceChart.updateNote(i.host, note, true);
				}
			});
		}

		if (data.renote && data.text) {
			// Increment notes count (user)
			this.incNotesCountOfUser(user);
		} else if (!data.renote) {
			// Increment notes count (user)
			this.incNotesCountOfUser(user);
		}

		this.pushToTl(note, user, ['localTimeline', 'homeTimeline', 'userListTimeline', 'antennaTimeline']);

		this.antennaService.addNoteToAntennas(note, user);

		if (data.reply) {
			this.saveReply(data.reply, note);
		}

		if (data.reply == null) {
			// TODO: キャッシュ
			this.followingsRepository.findBy({
				followeeId: user.id,
				notify: 'normal',
			}).then(followings => {
				for (const following of followings) {
					// TODO: ワードミュート考慮
					this.notificationService.createNotification(following.followerId, 'note', {
						noteId: note.id,
					}, user.id);
				}
			});
		}

		if (data.renote && data.text == null && data.renote.userId !== user.id && !user.isBot) {
			this.incRenoteCount(data.renote);
		}

		if (data.poll && data.poll.expiresAt) {
			const delay = data.poll.expiresAt.getTime() - Date.now();
			this.queueService.endedPollNotificationQueue.add(note.id, {
				noteId: note.id,
			}, {
				delay,
				removeOnComplete: true,
			});
		}

		// Pack the note
		const noteObj = await this.noteEntityService.pack(note, null, { skipHide: true, withReactionAndUserPairCache: true });

		if (data.channel) {
			this.channelsRepository.increment({ id: data.channel.id }, 'notesCount', 1);
			this.channelsRepository.update(data.channel.id, {
				lastNotedAt: new Date(),
			});

			this.notesRepository.countBy({
				userId: user.id,
				channelId: data.channel.id,
			}).then(count => {
				// この処理が行われるのはノート作成後なので、ノートが一つしかなかったら最初の投稿だと判断できる
				// TODO: とはいえノートを削除して何回も投稿すればその分だけインクリメントされる雑さもあるのでどうにかしたい
				if (count === 1) {
					this.channelsRepository.increment({ id: data.channel!.id }, 'usersCount', 1);
				}
			});
		}

		// Register to search database
		this.index(note);
	}

	@bindThis
	private isRenote(note: Option): note is Option & { renote: MiNote } {
		return note.renote != null;
	}

	@bindThis
	private isQuote(note: Option & { renote: MiNote }): note is Option & { renote: MiNote } & (
		{ text: string } | { cw: string } | { reply: MiNote } | { poll: IPoll } | { files: MiDriveFile[] }
	) {
		// NOTE: SYNC WITH misc/is-quote.ts
		return note.text != null ||
			note.reply != null ||
			note.cw != null ||
			note.poll != null ||
			(note.files != null && note.files.length > 0);
	}

	@bindThis
	private incRenoteCount(renote: MiNote) {
		this.notesRepository.createQueryBuilder().update()
			.set({
				renoteCount: () => '"renoteCount" + 1',
			})
			.where('id = :id', { id: renote.id })
			.execute();

		// 3日以内に投稿されたノートの場合ハイライト用ランキング更新
		if ((Date.now() - this.idService.parse(renote.id).date.getTime()) < 1000 * 60 * 60 * 24 * 3) {
			if (renote.channelId != null) {
				if (renote.replyId == null) {
					this.featuredService.updateInChannelNotesRanking(renote.channelId, renote.id, 5);
				}
			} else {
				if (renote.visibility === 'public' && renote.replyId == null) {
					this.featuredService.updateGlobalNotesRanking(renote.id, 5);
					if (renote.userHost == null) {
						this.featuredService.updatePerUserNotesRanking(renote.userId, renote.id, 5);
					}
				}
			}
		}
	}

	@bindThis
	private async createMentionedEvents(mentionedUsers: MinimumUser[], note: MiNote, nm: NotificationManager) {
		for (const u of mentionedUsers.filter(u => this.userEntityService.isLocalUser(u))) {
			const isThreadMuted = await this.noteThreadMutingsRepository.exists({
				where: {
					userId: u.id,
					threadId: note.threadId ?? note.id,
				},
			});

			if (isThreadMuted) {
				continue;
			}

			const detailPackedNote = await this.noteEntityService.pack(note, u, {
				detail: true,
			});

			this.globalEventService.publishMainStream(u.id, 'mention', detailPackedNote);
			this.webhookService.enqueueUserWebhook(u.id, 'mention', { note: detailPackedNote });

			// Create notification
			nm.push(u.id, 'mention');
		}
	}

	@bindThis
	private saveReply(reply: MiNote, note: MiNote) {
		this.notesRepository.increment({ id: reply.id }, 'repliesCount', 1);
	}

	@bindThis
	private async renderNoteOrRenoteActivity(data: Option, note: MiNote) {
		if (data.localOnly) return null;

		const content = this.isRenote(data) && !this.isQuote(data)
			? this.apRendererService.renderAnnounce(data.renote.uri ? data.renote.uri : `${this.config.url}/notes/${data.renote.id}`, note)
			: this.apRendererService.renderCreate(await this.apRendererService.renderNote(note, false), note);

		return this.apRendererService.addContext(content);
	}

	@bindThis
	private index(note: MiNote) {
		if (note.text == null && note.cw == null) return;

		this.searchService.indexNote(note);
	}

	@bindThis
	private incNotesCountOfUser(user: { id: MiUser['id']; }) {
		this.usersRepository.createQueryBuilder().update()
			.set({
				updatedAt: new Date(),
				notesCount: () => '"notesCount" + 1',
			})
			.where('id = :id', { id: user.id })
			.execute();
	}

	@bindThis
	private async extractMentionedUsers(user: { host: MiUser['host']; }, tokens: mfm.MfmNode[]): Promise<MiUser[]> {
		if (tokens == null) return [];

		const mentions = extractMentions(tokens);
		let mentionedUsers = (await Promise.all(mentions.map(m =>
			this.remoteUserResolveService.resolveUser(m.username, m.host ?? user.host).catch(() => null),
		))).filter(x => x != null);

		// Drop duplicate users
		mentionedUsers = mentionedUsers.filter((u, i, self) =>
			i === self.findIndex(u2 => u.id === u2.id),
		);

		return mentionedUsers;
	}

	@bindThis
	private async pushToTl(note: MiNote, user: { id: MiUser['id']; host: MiUser['host']; }, notToPush?: FanoutTimelineNamePrefix[]) {
		if (!this.meta.enableFanoutTimeline) return;

		// やみモード投稿はやみタイムラインのみに流す
		if (note.isNoteInYamiMode) {
			const r = this.redisForTimelines.pipeline();

			// 自分自身のやみタイムラインに追加
			this.fanoutTimelineService.push(`yamiTimeline:${user.id}`, note.id, 300, r);
			if (note.fileIds.length > 0) {
				this.fanoutTimelineService.push(`yamiTimelineWithFiles:${user.id}`, note.id, 300, r);
			}

			// フォロワーのやみタイムラインに追加
			// ただしDMの場合は宛先に含まれるユーザーのみに制限
			this.followingsRepository.find({
				where: {
					followeeId: user.id,
					followerHost: IsNull(),
					isFollowerHibernated: false,
				},
				select: ['followerId'],
			}).then(followings => {
				if (followings.length === 0) return;

				const followingsPipeline = this.redisForTimelines.pipeline();
				for (const following of followings) {
					// DMの場合は宛先チェック - visibleUserIdsに含まれていない場合はスキップ
					if (note.visibility === 'specified' &&
						(!note.visibleUserIds || !note.visibleUserIds.includes(following.followerId))) {
						continue;
					}

					this.fanoutTimelineService.push(`yamiTimeline:${following.followerId}`, note.id, 300, followingsPipeline);
					if (note.fileIds.length > 0) {
						this.fanoutTimelineService.push(`yamiTimelineWithFiles:${following.followerId}`, note.id, 300, followingsPipeline);
					}
				}
				followingsPipeline.exec();
			});

			// パブリックなやみノートの場合の処理
			if (note.visibility === 'public') {
				this.fanoutTimelineService.push('yamiPublicNotes', note.id, 1000, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push('yamiPublicNotesWithFiles', note.id, 500, r);
				}
			}

			// 自分自身のプロフィールタイムラインにも追加
			this.fanoutTimelineService.push(`userTimeline:${user.id}`, note.id,
				user.host == null ? this.meta.perLocalUserUserTimelineCacheMax : this.meta.perRemoteUserUserTimelineCacheMax, r);
			if (note.fileIds.length > 0) {
				this.fanoutTimelineService.push(`userTimelineWithFiles:${user.id}`, note.id,
					user.host == null ? this.meta.perLocalUserUserTimelineCacheMax / 2 : this.meta.perRemoteUserUserTimelineCacheMax / 2, r);
			}

			// 返信の場合は返信タイムラインにも追加
			if (isReply(note)) {
				this.fanoutTimelineService.push(`userTimelineWithReplies:${user.id}`, note.id,
					user.host == null ? this.meta.perLocalUserUserTimelineCacheMax : this.meta.perRemoteUserUserTimelineCacheMax, r);

				// 特定ユーザーへの返信の場合
				if (note.replyUserId) {
					this.fanoutTimelineService.push(`yamiTimelineWithReplyTo:${note.replyUserId}`, note.id, 300, r);
				}
			}

			// パイプライン実行
			r.exec();
			return;
		}

		// 以下、通常の投稿処理（やみモードでない場合）
		const notToPushSet = notToPush ? new Set(notToPush) : null;
		const shouldPush = (prefix: FanoutTimelineNamePrefix): boolean => {
			return !notToPushSet || !notToPushSet.has(prefix);
		};

		// チャンネル投稿の場合（本家仕様）
		if (note.channelId) {
			const r = this.redisForTimelines.pipeline();

			// チャンネルタイムラインへ配信
			this.fanoutTimelineService.push(`channelTimeline:${note.channelId}`, note.id, this.config.perChannelMaxNoteCacheCount, r);

			// 投稿者のuserTimelineWithChannelへ配信（本家仕様: チャンネル投稿専用タイムライン）
			this.fanoutTimelineService.push(`userTimelineWithChannel:${user.id}`, note.id, user.host == null ? this.meta.perLocalUserUserTimelineCacheMax : this.meta.perRemoteUserUserTimelineCacheMax, r);

			// チャンネルをフォローしている人のタイムラインへの配信ロジック（本家仕様）
			const channelFollowings = await this.channelFollowingsRepository.find({
				where: { followeeId: note.channelId },
				select: ['followerId'],
			});

			for (const channelFollowing of channelFollowings) {
				this.fanoutTimelineService.push(`homeTimeline:${channelFollowing.followerId}`, note.id, this.meta.perUserHomeTimelineCacheMax, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push(`homeTimelineWithFiles:${channelFollowing.followerId}`, note.id, this.meta.perUserHomeTimelineCacheMax / 2, r);
				}
			}

			// パイプラインを実行
			r.exec();
			return;
		}

		// 通常の投稿の処理（チャンネル以外）
		const r = this.redisForTimelines.pipeline();

		// TODO: キャッシュ？
		// eslint-disable-next-line prefer-const
		let [followings, userListMemberships] = await Promise.all([
			this.followingsRepository.find({
				where: {
					followeeId: user.id,
					followerHost: IsNull(), // リモートユーザーのフォローは除外
					isFollowerHibernated: false,
				},
				select: ['followerId', 'withReplies'],
			}),
			this.userListMembershipsRepository.find({
				where: {
					userId: user.id,
				},
				select: ['userListId', 'userListUserId', 'withReplies'],
			}),
		]);

		if (note.visibility === 'followers') {
			userListMemberships = userListMemberships.filter(x => x.userListUserId === user.id || followings.some(f => f.followerId === x.userListUserId));
		}

		// フォロワーのホームタイムラインに配信（重要！）
		for (const following of followings) {
			// 基本的にvisibleUserIdsには自身のidが含まれている前提であること
			if (note.visibility === 'specified' && !note.visibleUserIds.some(v => v === following.followerId)) continue;

			// 「自分自身への返信 or そのフォロワーへの返信」のどちらでもない場合
			if (isReply(note, following.followerId)) {
				if (!following.withReplies) continue;
			}

			if (shouldPush('homeTimeline')) {
				this.fanoutTimelineService.push(`homeTimeline:${following.followerId}`, note.id, this.meta.perUserHomeTimelineCacheMax, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push(`homeTimelineWithFiles:${following.followerId}`, note.id, this.meta.perUserHomeTimelineCacheMax / 2, r);
				}
			}
		}

		// ユーザーリストへの配信
		for (const userListMembership of userListMemberships) {
			// ダイレクトのとき、そのリストが対象外のユーザーの場合
			if (note.visibility === 'specified' &&
				note.userId !== userListMembership.userListUserId &&
				!note.visibleUserIds.some(v => v === userListMembership.userListUserId)) continue;

			if (isReply(note, userListMembership.userListUserId)) {
				if (!userListMembership.withReplies) continue;
			}

			if (shouldPush('userListTimeline')) {
				this.fanoutTimelineService.push(`userListTimeline:${userListMembership.userListId}`, note.id, this.meta.perUserListTimelineCacheMax, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push(`userListTimelineWithFiles:${userListMembership.userListId}`, note.id, this.meta.perUserListTimelineCacheMax / 2, r);
				}
			}
		}

		// 自分自身のHTL
		if (note.userHost == null) {
			if (note.visibility !== 'specified' || !note.visibleUserIds.some(v => v === user.id)) {
				if (shouldPush('homeTimeline')) {
					this.fanoutTimelineService.push(`homeTimeline:${user.id}`, note.id, this.meta.perUserHomeTimelineCacheMax, r);
					if (note.fileIds.length > 0) {
						this.fanoutTimelineService.push(`homeTimelineWithFiles:${user.id}`, note.id, this.meta.perUserHomeTimelineCacheMax / 2, r);
					}
				}
			}
		}

		// 自分自身以外への返信
		if (isReply(note)) {
			if (shouldPush('userTimeline')) {
				this.fanoutTimelineService.push(`userTimelineWithReplies:${user.id}`, note.id, user.host == null ? this.meta.perLocalUserUserTimelineCacheMax : this.meta.perRemoteUserUserTimelineCacheMax, r);
			}

			if (note.visibility === 'public' && note.userHost == null) {
				if (shouldPush('localTimeline')) {
					this.fanoutTimelineService.push('localTimelineWithReplies', note.id, 300, r);
					if (note.replyUserHost == null) {
						this.fanoutTimelineService.push(`localTimelineWithReplyTo:${note.replyUserId}`, note.id, 300 / 10, r);
					}
				}
			}
		} else {
			if (shouldPush('userTimeline')) {
				this.fanoutTimelineService.push(`userTimeline:${user.id}`, note.id, user.host == null ? this.meta.perLocalUserUserTimelineCacheMax : this.meta.perRemoteUserUserTimelineCacheMax, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push(`userTimelineWithFiles:${user.id}`, note.id, user.host == null ? this.meta.perLocalUserUserTimelineCacheMax / 2 : this.meta.perRemoteUserUserTimelineCacheMax / 2, r);
				}
			}
		}

		// LOCAL
		if (note.visibility === 'public' && note.userHost == null) {
			if (shouldPush('localTimeline')) {
				this.fanoutTimelineService.push('localTimeline', note.id, 1000, r);
				if (note.fileIds.length > 0) {
					this.fanoutTimelineService.push('localTimelineWithFiles', note.id, 500, r);
				}
			}
		}

		// ヒベルネーションチェック（重要）
		if (Math.random() < 0.1) {
			process.nextTick(() => {
				this.checkHibernation(followings);
			});
		}

		// パイプラインを実行
		r.exec();
	}

	@bindThis
	public async checkHibernation(followings: MiFollowing[]) {
		if (followings.length === 0) return;

		const shuffle = (array: MiFollowing[]) => {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			return array;
		};

		// ランダムに最大1000件サンプリング
		const samples = shuffle(followings).slice(0, Math.min(followings.length, 1000));

		const hibernatedUsers = await this.usersRepository.find({
			where: {
				id: In(samples.map(x => x.followerId)),
				lastActiveDate: LessThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 50))),
			},
			select: ['id'],
		});

		if (hibernatedUsers.length > 0) {
			this.usersRepository.update({
				id: In(hibernatedUsers.map(x => x.id)),
			}, {
				isHibernated: true,
			});

			this.followingsRepository.update({
				followerId: In(hibernatedUsers.map(x => x.id)),
			}, {
				isFollowerHibernated: true,
			});
		}
	}

	public checkProhibitedWordsContain(content: Parameters<UtilityService['concatNoteContentsForKeyWordCheck']>[0], prohibitedWords?: string[]) {
		if (prohibitedWords == null) {
			prohibitedWords = this.meta.prohibitedWords;
		}

		if (
			this.utilityService.isKeyWordIncluded(
				this.utilityService.concatNoteContentsForKeyWordCheck(content),
				prohibitedWords,
			)
		) {
			return true;
		}
		return false;
	}

	@bindThis
	private collapseNotesCount(oldValue: number, newValue: number) {
		return oldValue + newValue;
	}

	@bindThis
	private async performUpdateNotesCount(id: MiNote['id'], incrBy: number) {
		await this.instancesRepository.increment({ id: id }, 'notesCount', incrBy);
	}

	@bindThis
	private async deliverYamiNote(note: MiNote, user: { id: MiUser['id'] }, dm: any): Promise<void> {
		const meta = await this.metaService.fetch();

		// 連合が無効なら配送しない
		if (!meta.yamiNoteFederationEnabled) {
			await this.notesRepository.update(note.id, { localOnly: true });
			return;
		}

		// 信頼済みホストリスト
		const trustedHosts = meta.yamiNoteFederationTrustedInstances || [];
		if (trustedHosts.length === 0) return;

		try {
			// リモートフォロワーを取得して、信頼済みホストのみフィルタリング
			const followers = await this.followingsRepository.find({
				where: {
					followeeId: user.id,
					followerHost: Not(IsNull()),
				},
				relations: ['follower'],
			});

			// 信頼済みフォロワーにのみ配送
			const trustedFollowers = followers.filter(following =>
				following.follower && this.utilityService.isTrustedHost(following.follower.host, trustedHosts),
			);

			for (const following of trustedFollowers) {
				if (!following.follower) continue;
				dm.addDirectRecipe(following.follower as MiRemoteUser);
			}

			// 配信実行
			await dm.execute();
		} catch (err) {
			console.error(`[YamiNote] 配信エラー: ${err}`);
		}
	}

	@bindThis
	public async dispose(): Promise<void> {
		this.#shutdownController.abort();
		await this.updateNotesCountQueue.performAllNow();
	}

	@bindThis
	public async onApplicationShutdown(signal?: string | undefined): Promise<void> {
		await this.dispose();
	}
}
