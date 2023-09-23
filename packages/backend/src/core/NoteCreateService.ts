/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import * as mfm from 'mfm-js';
import { In, DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import RE2 from 're2';
import { extractMentions } from '@/misc/extract-mentions.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { MiNote } from '@/models/Note.js';
import type { ChannelsRepository, FollowingsRepository, InstancesRepository, MutedNotesRepository, MutingsRepository, NotesRepository, NoteThreadMutingsRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiApp } from '@/models/App.js';
import { concat } from '@/misc/prelude/array.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser, MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { IPoll } from '@/models/Poll.js';
import { MiPoll } from '@/models/Poll.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { checkWordMute } from '@/misc/check-word-mute.js';
import type { MiChannel } from '@/models/Channel.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { MemorySingleCache } from '@/misc/cache.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
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
import { WebhookService } from '@/core/WebhookService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { AntennaService } from '@/core/AntennaService.js';
import { QueueService } from '@/core/QueueService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { bindThis } from '@/decorators.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { RoleService } from '@/core/RoleService.js';
import { MetaService } from '@/core/MetaService.js';
import { SearchService } from '@/core/SearchService.js';

const mutedWordsCache = new MemorySingleCache<{ userId: MiUserProfile['userId']; mutedWords: MiUserProfile['mutedWords']; }[]>(1000 * 60 * 5);

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
	public async deliver() {
		for (const x of this.queue) {
			// ミュート情報を取得
			const mentioneeMutes = await this.mutingsRepository.findBy({
				muterId: x.target,
			});

			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId);

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.notifier.id)) {
				this.notificationService.createNotification(x.target, x.reason, {
					notifierId: this.notifier.id,
					noteId: this.note.id,
				});
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
};

@Injectable()
export class NoteCreateService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

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

		@Inject(DI.mutedNotesRepository)
		private mutedNotesRepository: MutedNotesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private queueService: QueueService,
		private noteReadService: NoteReadService,
		private notificationService: NotificationService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
		private hashtagService: HashtagService,
		private antennaService: AntennaService,
		private webhookService: WebhookService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apDeliverManagerService: ApDeliverManagerService,
		private apRendererService: ApRendererService,
		private roleService: RoleService,
		private metaService: MetaService,
		private searchService: SearchService,
		private notesChart: NotesChart,
		private perUserNotesChart: PerUserNotesChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
	) { }

	@bindThis
	public async create(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		createdAt: MiUser['createdAt'];
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

		if (data.visibility === 'public' && data.channel == null) {
			const sensitiveWords = (await this.metaService.fetch()).sensitiveWords;
			if (this.isSensitive(data, sensitiveWords)) {
				data.visibility = 'home';
			} else if ((await this.roleService.getUserPolicies(user.id)).canPublicNote === false) {
				data.visibility = 'home';
			}
		}

		// Renote対象が「ホームまたは全体」以外の公開範囲ならreject
		if (data.renote && data.renote.visibility !== 'public' && data.renote.visibility !== 'home' && data.renote.userId !== user.id) {
			throw new Error('Renote target is not public or home');
		}

		// Renote対象がpublicではないならhomeにする
		if (data.renote && data.renote.visibility !== 'public' && data.visibility === 'public') {
			data.visibility = 'home';
		}

		// Renote対象がfollowersならfollowersにする
		if (data.renote && data.renote.visibility === 'followers') {
			data.visibility = 'followers';
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
			const tokens = data.text ? mfm.parse(data.text)! : [];
			const cwTokens = data.cw ? mfm.parse(data.cw)! : [];
			const choiceTokens = data.poll && data.poll.choices
				? concat(data.poll.choices.map(choice => mfm.parse(choice)!))
				: [];

			const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

			tags = data.apHashtags ?? extractHashtags(combinedTokens);

			emojis = data.apEmojis ?? extractCustomEmojisFromMfm(combinedTokens);

			mentionedUsers = data.apMentions ?? await this.extractMentionedUsers(user, combinedTokens);
		}

		tags = tags.filter(tag => Array.from(tag ?? '').length <= 128).splice(0, 32);

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

		if (data.channel) {
			this.redisClient.xadd(
				`channelTimeline:${data.channel.id}`,
				'MAXLEN', '~', this.config.perChannelMaxNoteCacheCount.toString(),
				'*',
				'note', note.id);
		}

		setImmediate('post created', { signal: this.#shutdownController.signal }).then(
			() => this.postNoteCreated(note, user, data, silent, tags!, mentionedUsers!),
			() => { /* aborted, ignore this */ },
		);

		return note;
	}

	@bindThis
	private async insertNote(user: { id: MiUser['id']; host: MiUser['host']; }, data: Option, tags: string[], emojis: string[], mentionedUsers: MinimumUser[]) {
		const insert = new MiNote({
			id: this.idService.genId(data.createdAt!),
			createdAt: data.createdAt!,
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
			cw: data.cw ?? null,
			tags: tags.map(tag => normalizeForSearch(tag)),
			emojis,
			userId: user.id,
			localOnly: data.localOnly!,
			reactionAcceptance: data.reactionAcceptance,
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
					});

					await transactionalEntityManager.insert(MiPoll, poll);
				});
			} else {
				await this.notesRepository.insert(insert);
			}

			return insert;
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
		createdAt: MiUser['createdAt'];
		isBot: MiUser['isBot'];
	}, data: Option, silent: boolean, tags: string[], mentionedUsers: MinimumUser[]) {
		const meta = await this.metaService.fetch();

		this.notesChart.update(note, true);
		if (meta.enableChartsForRemoteUser || (user.host == null)) {
			this.perUserNotesChart.update(user, note, true);
		}

		// Register host
		if (this.userEntityService.isRemoteUser(user)) {
			this.federatedInstanceService.fetch(user.host).then(async i => {
				this.instancesRepository.increment({ id: i.id }, 'notesCount', 1);
				if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
					this.instanceChart.updateNote(i.host, note, true);
				}
			});
		}

		// ハッシュタグ更新
		if (data.visibility === 'public' || data.visibility === 'home') {
			this.hashtagService.updateHashtags(user, tags);
		}

		// Increment notes count (user)
		this.incNotesCountOfUser(user);

		// Word mute
		mutedWordsCache.fetch(() => this.userProfilesRepository.find({
			where: {
				enableWordMute: true,
			},
			select: ['userId', 'mutedWords'],
		})).then(us => {
			for (const u of us) {
				checkWordMute(note, { id: u.userId }, u.mutedWords).then(shouldMute => {
					if (shouldMute) {
						this.mutedNotesRepository.insert({
							id: this.idService.genId(),
							userId: u.userId,
							noteId: note.id,
							reason: 'word',
						});
					}
				});
			}
		});

		this.antennaService.addNoteToAntennas(note, user);

		if (data.reply) {
			this.saveReply(data.reply, note);
		}

		if (data.reply == null) {
			this.followingsRepository.findBy({
				followeeId: user.id,
				notify: 'normal',
			}).then(followings => {
				for (const following of followings) {
					this.notificationService.createNotification(following.followerId, 'note', {
						notifierId: user.id,
						noteId: note.id,
					});
				}
			});
		}

		// この投稿を除く指定したユーザーによる指定したノートのリノートが存在しないとき
		if (data.renote && (await this.noteEntityService.countSameRenotes(user.id, data.renote.id, note.id) === 0)) {
			if (!user.isBot) this.incRenoteCount(data.renote);
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

		if (!silent) {
			if (this.userEntityService.isLocalUser(user)) this.activeUsersChart.write(user);

			// 未読通知を作成
			if (data.visibility === 'specified') {
				if (data.visibleUsers == null) throw new Error('invalid param');

				for (const u of data.visibleUsers) {
					// ローカルユーザーのみ
					if (!this.userEntityService.isLocalUser(u)) continue;

					this.noteReadService.insertNoteUnread(u.id, note, {
						isSpecified: true,
						isMentioned: false,
					});
				}
			} else {
				for (const u of mentionedUsers) {
					// ローカルユーザーのみ
					if (!this.userEntityService.isLocalUser(u)) continue;

					this.noteReadService.insertNoteUnread(u.id, note, {
						isSpecified: false,
						isMentioned: true,
					});
				}
			}

			// Pack the note
			const noteObj = await this.noteEntityService.pack(note);

			this.globalEventService.publishNotesStream(noteObj);

			this.roleService.addNoteToRoleTimeline(noteObj);

			this.webhookService.getActiveWebhooks().then(webhooks => {
				webhooks = webhooks.filter(x => x.userId === user.id && x.on.includes('note'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'note', {
						note: noteObj,
					});
				}
			});

			const nm = new NotificationManager(this.mutingsRepository, this.notificationService, user, note);

			await this.createMentionedEvents(mentionedUsers, note, nm);

			// If has in reply to note
			if (data.reply) {
				// 通知
				if (data.reply.userHost === null) {
					const isThreadMuted = await this.noteThreadMutingsRepository.exist({
						where: {
							userId: data.reply.userId,
							threadId: data.reply.threadId ?? data.reply.id,
						},
					});

					if (!isThreadMuted) {
						nm.push(data.reply.userId, 'reply');
						this.globalEventService.publishMainStream(data.reply.userId, 'reply', noteObj);

						const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === data.reply!.userId && x.on.includes('reply'));
						for (const webhook of webhooks) {
							this.queueService.webhookDeliver(webhook, 'reply', {
								note: noteObj,
							});
						}
					}
				}
			}

			// If it is renote
			if (data.renote) {
				const type = data.text ? 'quote' : 'renote';

				// Notify
				if (data.renote.userHost === null) {
					nm.push(data.renote.userId, type);
				}

				// Publish event
				if ((user.id !== data.renote.userId) && data.renote.userHost === null) {
					this.globalEventService.publishMainStream(data.renote.userId, 'renote', noteObj);

					const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === data.renote!.userId && x.on.includes('renote'));
					for (const webhook of webhooks) {
						this.queueService.webhookDeliver(webhook, 'renote', {
							note: noteObj,
						});
					}
				}
			}

			nm.deliver();

			//#region AP deliver
			if (this.userEntityService.isLocalUser(user)) {
				(async () => {
					const noteActivity = await this.renderNoteOrRenoteActivity(data, note);
					const dm = this.apDeliverManagerService.createDeliverManager(user, noteActivity);

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

					dm.execute();
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
	private isSensitive(note: Option, sensitiveWord: string[]): boolean {
		if (sensitiveWord.length > 0) {
			const text = note.cw ?? note.text ?? '';
			if (text === '') return false;
			const matched = sensitiveWord.some(filter => {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);
				// This should never happen due to input sanitisation.
				if (!regexp) {
					const words = filter.split(' ');
					return words.every(keyword => text.includes(keyword));
				}
				try {
					return new RE2(regexp[1], regexp[2]).test(text);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			});
			if (matched) return true;
		}
		return false;
	}

	@bindThis
	private incRenoteCount(renote: MiNote) {
		this.notesRepository.createQueryBuilder().update()
			.set({
				renoteCount: () => '"renoteCount" + 1',
				score: () => '"score" + 1',
			})
			.where('id = :id', { id: renote.id })
			.execute();
	}

	@bindThis
	private async createMentionedEvents(mentionedUsers: MinimumUser[], note: MiNote, nm: NotificationManager) {
		for (const u of mentionedUsers.filter(u => this.userEntityService.isLocalUser(u))) {
			const isThreadMuted = await this.noteThreadMutingsRepository.exist({
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

			const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === u.id && x.on.includes('mention'));
			for (const webhook of webhooks) {
				this.queueService.webhookDeliver(webhook, 'mention', {
					note: detailPackedNote,
				});
			}

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

		const content = data.renote && data.text == null && data.poll == null && (data.files == null || data.files.length === 0)
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
		))).filter(x => x != null) as MiUser[];

		// Drop duplicate users
		mentionedUsers = mentionedUsers.filter((u, i, self) =>
			i === self.findIndex(u2 => u.id === u2.id),
		);

		return mentionedUsers;
	}

	@bindThis
	public dispose(): void {
		this.#shutdownController.abort();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
