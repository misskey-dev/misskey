import * as mfm from 'mfm-js';
import { Not, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { extractMentions } from '@/misc/extract-mentions.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type { IMentionedRemoteUsers } from '@/models/entities/note.js';
import { Note } from '@/models/entities/note.js';
import type { Notes } from '@/models/index.js';
import { Mutings, Users, NoteWatchings, Instances, UserProfiles, MutedNotes, Channels, ChannelFollowings, NoteThreadMutings } from '@/models/index.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import type { App } from '@/models/entities/app.js';
import { insertNoteUnread } from '@/services/note/unread.js';
import { concat } from '@/prelude/array.js';
import { resolveUser } from '@/services/remote/resolve-user.js';
import { renderActivity } from '@/services/remote/activitypub/renderer/index.js';
import renderAnnounce from '@/services/remote/activitypub/renderer/announce.js';
import renderCreate from '@/services/remote/activitypub/renderer/create.js';
import renderNote from '@/services/remote/activitypub/renderer/note.js';
import DeliverManager from '@/services/remote/activitypub/deliver-manager.js';
import { genId } from '@/misc/gen-id.js';
import type { User, ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import type { IPoll } from '@/models/entities/poll.js';
import { Poll } from '@/models/entities/poll.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { checkHitAntenna } from '@/misc/check-hit-antenna.js';
import { checkWordMute } from '@/misc/check-word-mute.js';
import { countSameRenotes } from '@/misc/count-same-renotes.js';
import type { Channel } from '@/models/entities/channel.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { getAntennas } from '@/misc/antenna-cache.js';
import { Cache } from '@/misc/cache.js';
import type { UserProfile } from '@/models/entities/user-profile.js';
import { db } from '@/db/postgre.js';
import type { RelayService } from '@/services/RelayService.js';
import type { FederatedInstanceService } from '@/services/FederatedInstanceService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import type NotesChart from '@/services/chart/charts/notes.js';
import type PerUserNotesChart from '@/services/chart/charts/per-user-notes.js';
import type InstanceChart from '@/services/chart/charts/instance.js';
import type ActiveUsersChart from '@/services/chart/charts/active-users.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';
import type { CreateNotificationService } from '@/services/CreateNotificationService.js';
import type { WebhookService } from '@/services/WebhookService.js';
import type { HashtagService } from '@/services/HashtagService.js';
import type { AntennaService } from '@/services/AntennaService.js';
import type { QueueService } from '@/queue/queue.service.js';
import es from '../db/elasticsearch.js';

const mutedWordsCache = new Cache<{ userId: UserProfile['userId']; mutedWords: UserProfile['mutedWords']; }[]>(1000 * 60 * 5);

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention';

class NotificationManager {
	private notifier: { id: User['id']; };
	private note: Note;
	private queue: {
		target: ILocalUser['id'];
		reason: NotificationType;
	}[];

	constructor(private createNotificationService: CreateNotificationService, notifier: { id: User['id']; }, note: Note) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser['id'], reason: NotificationType) {
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

	public async deliver() {
		for (const x of this.queue) {
			// ミュート情報を取得
			const mentioneeMutes = await Mutings.findBy({
				muterId: x.target,
			});

			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId);

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.notifier.id)) {
				this.createNotificationService.createNotification(x.target, x.reason, {
					notifierId: this.notifier.id,
					noteId: this.note.id,
				});
			}
		}
	}
}

type MinimumUser = {
	id: User['id'];
	host: User['host'];
	username: User['username'];
	uri: User['uri'];
};

type Option = {
	createdAt?: Date | null;
	name?: string | null;
	text?: string | null;
	reply?: Note | null;
	renote?: Note | null;
	files?: DriveFile[] | null;
	poll?: IPoll | null;
	localOnly?: boolean | null;
	cw?: string | null;
	visibility?: string;
	visibleUsers?: MinimumUser[] | null;
	channel?: Channel | null;
	apMentions?: MinimumUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	uri?: string | null;
	url?: string | null;
	app?: App | null;
};

@Injectable()
export class NoteCreateService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		private globalEventServie: GlobalEventService,
		private queueService: QueueService,
		private createNotificationService: CreateNotificationService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
		private hashtagService: HashtagService,
		private antennaService: AntennaService,
		private webhookService: WebhookService,
		private notesChart: NotesChart,
		private perUserNotesChart: PerUserNotesChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
	) {}

	public async create(user: {
		id: User['id'];
		username: User['username'];
		host: User['host'];
		isSilenced: User['isSilenced'];
		createdAt: User['createdAt'];
	}, data: Option, silent = false): Promise<Note> {
		// チャンネル外にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && data.channel && data.reply.channelId !== data.channel.id) {
			if (data.reply.channelId) {
				data.channel = await Channels.findOneBy({ id: data.reply.channelId });
			} else {
				data.channel = null;
			}
		}

		// チャンネル内にリプライしたら対象のスコープに合わせる
		// (クライアントサイドでやっても良い処理だと思うけどとりあえずサーバーサイドで)
		if (data.reply && (data.channel == null) && data.reply.channelId) {
			data.channel = await Channels.findOneBy({ id: data.reply.channelId });
		}

		if (data.createdAt == null) data.createdAt = new Date();
		if (data.visibility == null) data.visibility = 'public';
		if (data.localOnly == null) data.localOnly = false;
		if (data.channel != null) data.visibility = 'public';
		if (data.channel != null) data.visibleUsers = [];
		if (data.channel != null) data.localOnly = true;

		// サイレンス
		if (user.isSilenced && data.visibility === 'public' && data.channel == null) {
			data.visibility = 'home';
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

			tags = data.apHashtags || extractHashtags(combinedTokens);

			emojis = data.apEmojis || extractCustomEmojisFromMfm(combinedTokens);

			mentionedUsers = data.apMentions || await this.#extractMentionedUsers(user, combinedTokens);
		}

		tags = tags.filter(tag => Array.from(tag || '').length <= 128).splice(0, 32);

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

		const note = await this.#insertNote(user, data, tags, emojis, mentionedUsers);

		setImmediate(() => this.#postNoteCreated(note, user, data, silent, tags!, mentionedUsers!));

		return note;
	}

	async #insertNote(user: { id: User['id']; host: User['host']; }, data: Option, tags: string[], emojis: string[], mentionedUsers: MinimumUser[]) {
		const insert = new Note({
			id: genId(data.createdAt!),
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
			cw: data.cw == null ? null : data.cw,
			tags: tags.map(tag => normalizeForSearch(tag)),
			emojis,
			userId: user.id,
			localOnly: data.localOnly!,
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
			const profiles = await UserProfiles.findBy({ userId: In(insert.mentions) });
			insert.mentionedRemoteUsers = JSON.stringify(mentionedUsers.filter(u => Users.isRemoteUser(u)).map(u => {
				const profile = profiles.find(p => p.userId === u.id);
				const url = profile != null ? profile.url : null;
				return {
					uri: u.uri,
					url: url == null ? undefined : url,
					username: u.username,
					host: u.host,
				} as IMentionedRemoteUsers[0];
			}));
		}

		// 投稿を作成
		try {
			if (insert.hasPoll) {
			// Start transaction
				await db.transaction(async transactionalEntityManager => {
					await transactionalEntityManager.insert(Note, insert);

					const poll = new Poll({
						noteId: insert.id,
						choices: data.poll!.choices,
						expiresAt: data.poll!.expiresAt,
						multiple: data.poll!.multiple,
						votes: new Array(data.poll!.choices.length).fill(0),
						noteVisibility: insert.visibility,
						userId: user.id,
						userHost: user.host,
					});

					await transactionalEntityManager.insert(Poll, poll);
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

	async #postNoteCreated(note: Note, user: {
		id: User['id'];
		username: User['username'];
		host: User['host'];
		isSilenced: User['isSilenced'];
		createdAt: User['createdAt'];
	}, data: Option, silent: boolean, tags: string[], mentionedUsers: MinimumUser[]) {
		// 統計を更新
		this.notesChart.update(note, true);
		this.perUserNotesChart.update(user, note, true);

		// Register host
		if (this.usersRepository.isRemoteUser(user)) {
			this.federatedInstanceService.registerOrFetchInstanceDoc(user.host).then(i => {
				Instances.increment({ id: i.id }, 'notesCount', 1);
				this.instanceChart.updateNote(i.host, note, true);
			});
		}

		// ハッシュタグ更新
		if (data.visibility === 'public' || data.visibility === 'home') {
			this.hashtagService.updateHashtags(user, tags);
		}

		// Increment notes count (user)
		this.#incNotesCountOfUser(user);

		// Word mute
		mutedWordsCache.fetch(null, () => UserProfiles.find({
			where: {
				enableWordMute: true,
			},
			select: ['userId', 'mutedWords'],
		})).then(us => {
			for (const u of us) {
				checkWordMute(note, { id: u.userId }, u.mutedWords).then(shouldMute => {
					if (shouldMute) {
						MutedNotes.insert({
							id: genId(),
							userId: u.userId,
							noteId: note.id,
							reason: 'word',
						});
					}
				});
			}
		});

		// Antenna
		for (const antenna of (await getAntennas())) {
			checkHitAntenna(antenna, note, user).then(hit => {
				if (hit) {
					this.antennaService.addNoteToAntenna(antenna, note, user);
				}
			});
		}

		// Channel
		if (note.channelId) {
			ChannelFollowings.findBy({ followeeId: note.channelId }).then(followings => {
				for (const following of followings) {
					insertNoteUnread(following.followerId, note, {
						isSpecified: false,
						isMentioned: false,
					});
				}
			});
		}

		if (data.reply) {
			this.#saveReply(data.reply, note);
		}

		// この投稿を除く指定したユーザーによる指定したノートのリノートが存在しないとき
		if (data.renote && (await countSameRenotes(user.id, data.renote.id, note.id) === 0)) {
			this.#incRenoteCount(data.renote);
		}

		if (data.poll && data.poll.expiresAt) {
			const delay = data.poll.expiresAt.getTime() - Date.now();
			endedPollNotificationQueue.add({
				noteId: note.id,
			}, {
				delay,
				removeOnComplete: true,
			});
		}

		if (!silent) {
			if (this.usersRepository.isLocalUser(user)) this.activeUsersChart.write(user);

			// 未読通知を作成
			if (data.visibility === 'specified') {
				if (data.visibleUsers == null) throw new Error('invalid param');

				for (const u of data.visibleUsers) {
					// ローカルユーザーのみ
					if (!this.usersRepository.isLocalUser(u)) continue;

					insertNoteUnread(u.id, note, {
						isSpecified: true,
						isMentioned: false,
					});
				}
			} else {
				for (const u of mentionedUsers) {
					// ローカルユーザーのみ
					if (!this.usersRepository.isLocalUser(u)) continue;

					insertNoteUnread(u.id, note, {
						isSpecified: false,
						isMentioned: true,
					});
				}
			}

			// Pack the note
			const noteObj = await this.notesRepository.pack(note);

			this.globalEventServie.publishNotesStream(noteObj);

			this.webhookService.getActiveWebhooks().then(webhooks => {
				webhooks = webhooks.filter(x => x.userId === user.id && x.on.includes('note'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'note', {
						note: noteObj,
					});
				}
			});

			const nm = new NotificationManager(this.createNotificationService, user, note);
			const nmRelatedPromises = [];

			await this.#createMentionedEvents(mentionedUsers, note, nm);

			// If has in reply to note
			if (data.reply) {
				// Fetch watchers
				nmRelatedPromises.push(this.#notifyToWatchersOfReplyee(data.reply, user, nm));

				// 通知
				if (data.reply.userHost === null) {
					const threadMuted = await NoteThreadMutings.findOneBy({
						userId: data.reply.userId,
						threadId: data.reply.threadId || data.reply.id,
					});

					if (!threadMuted) {
						nm.push(data.reply.userId, 'reply');
						this.globalEventServie.publishMainStream(data.reply.userId, 'reply', noteObj);

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

				// Fetch watchers
				nmRelatedPromises.push(this.#notifyToWatchersOfRenotee(data.renote, user, nm, type));

				// Publish event
				if ((user.id !== data.renote.userId) && data.renote.userHost === null) {
					this.globalEventServie.publishMainStream(data.renote.userId, 'renote', noteObj);

					const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === data.renote!.userId && x.on.includes('renote'));
					for (const webhook of webhooks) {
						this.queueService.webhookDeliver(webhook, 'renote', {
							note: noteObj,
						});
					}
				}
			}

			Promise.all(nmRelatedPromises).then(() => {
				nm.deliver();
			});

			//#region AP deliver
			if (this.usersRepository.isLocalUser(user)) {
				(async () => {
					const noteActivity = await this.#renderNoteOrRenoteActivity(data, note);
					const dm = new DeliverManager(user, noteActivity);

					// メンションされたリモートユーザーに配送
					for (const u of mentionedUsers.filter(u => this.usersRepository.isRemoteUser(u))) {
						dm.addDirectRecipe(u as IRemoteUser);
					}

					// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
					if (data.reply && data.reply.userHost !== null) {
						const u = await this.usersRepository.findOneBy({ id: data.reply.userId });
						if (u && this.usersRepository.isRemoteUser(u)) dm.addDirectRecipe(u);
					}

					// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
					if (data.renote && data.renote.userHost !== null) {
						const u = await this.usersRepository.findOneBy({ id: data.renote.userId });
						if (u && this.usersRepository.isRemoteUser(u)) dm.addDirectRecipe(u);
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
			Channels.increment({ id: data.channel.id }, 'notesCount', 1);
			Channels.update(data.channel.id, {
				lastNotedAt: new Date(),
			});

			this.notesRepository.countBy({
				userId: user.id,
				channelId: data.channel.id,
			}).then(count => {
				// この処理が行われるのはノート作成後なので、ノートが一つしかなかったら最初の投稿だと判断できる
				// TODO: とはいえノートを削除して何回も投稿すればその分だけインクリメントされる雑さもあるのでどうにかしたい
				if (count === 1) {
					Channels.increment({ id: data.channel!.id }, 'usersCount', 1);
				}
			});
		}

		// Register to search database
		this.#index(note);
	}

	#incRenoteCount(renote: Note) {
		this.notesRepository.createQueryBuilder().update()
			.set({
				renoteCount: () => '"renoteCount" + 1',
				score: () => '"score" + 1',
			})
			.where('id = :id', { id: renote.id })
			.execute();
	}

	async #createMentionedEvents(mentionedUsers: MinimumUser[], note: Note, nm: NotificationManager) {
		for (const u of mentionedUsers.filter(u => this.usersRepository.isLocalUser(u))) {
			const threadMuted = await NoteThreadMutings.findOneBy({
				userId: u.id,
				threadId: note.threadId || note.id,
			});

			if (threadMuted) {
				continue;
			}

			const detailPackedNote = await this.notesRepository.pack(note, u, {
				detail: true,
			});

			this.globalEventServie.publishMainStream(u.id, 'mention', detailPackedNote);

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

	#saveReply(reply: Note, note: Note) {
		this.notesRepository.increment({ id: reply.id }, 'repliesCount', 1);
	}

	async #renderNoteOrRenoteActivity(data: Option, note: Note) {
		if (data.localOnly) return null;

		const content = data.renote && data.text == null && data.poll == null && (data.files == null || data.files.length === 0)
			? renderAnnounce(data.renote.uri ? data.renote.uri : `${this.config.url}/notes/${data.renote.id}`, note)
			: renderCreate(await renderNote(note, false), note);

		return renderActivity(content);
	}

	#index(note: Note) {
		if (note.text == null || this.config.elasticsearch == null) return;

	es!.index({
		index: this.config.elasticsearch.index || 'misskey_note',
		id: note.id.toString(),
		body: {
			text: normalizeForSearch(note.text),
			userId: note.userId,
			userHost: note.userHost,
		},
	});
	}

	async #notifyToWatchersOfRenotee(renote: Note, user: { id: User['id']; }, nm: NotificationManager, type: NotificationType) {
		const watchers = await NoteWatchings.findBy({
			noteId: renote.id,
			userId: Not(user.id),
		});

		for (const watcher of watchers) {
			nm.push(watcher.userId, type);
		}
	}

	async #notifyToWatchersOfReplyee(reply: Note, user: { id: User['id']; }, nm: NotificationManager) {
		const watchers = await NoteWatchings.findBy({
			noteId: reply.id,
			userId: Not(user.id),
		});

		for (const watcher of watchers) {
			nm.push(watcher.userId, 'reply');
		}
	}

	#incNotesCountOfUser(user: { id: User['id']; }) {
		this.usersRepository.createQueryBuilder().update()
			.set({
				updatedAt: new Date(),
				notesCount: () => '"notesCount" + 1',
			})
			.where('id = :id', { id: user.id })
			.execute();
	}

	async #extractMentionedUsers(user: { host: User['host']; }, tokens: mfm.MfmNode[]): Promise<User[]> {
		if (tokens == null) return [];

		const mentions = extractMentions(tokens);
		let mentionedUsers = (await Promise.all(mentions.map(m =>
			resolveUser(m.username, m.host || user.host).catch(() => null),
		))).filter(x => x != null) as User[];

		// Drop duplicate users
		mentionedUsers = mentionedUsers.filter((u, i, self) =>
			i === self.findIndex(u2 => u.id === u2.id),
		);

		return mentionedUsers;
	}
}
