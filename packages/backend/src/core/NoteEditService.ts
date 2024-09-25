/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import * as mfm from 'mfm-js';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In, LessThan } from 'typeorm';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { MiNote } from '@/models/Note.js';
import { MiNoteHistory } from '@/models/NoteHistory.js';
import type { ChannelsRepository, FollowingsRepository, InstancesRepository, MiFollowing, NotesRepository, NoteHistoriesRepository, UserProfilesRepository, UsersRepository, PollsRepository, DriveFilesRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { concat } from '@/misc/prelude/array.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser, MiRemoteUser } from '@/models/User.js';
import type { IPoll } from '@/models/Poll.js';
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
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { QueueService } from '@/core/QueueService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { bindThis } from '@/decorators.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { RoleService } from '@/core/RoleService.js';
import { MetaService } from '@/core/MetaService.js';
import { SearchService } from '@/core/SearchService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

type MinimumUser = {
	id: MiUser['id'];
	host: MiUser['host'];
	username: MiUser['username'];
	uri: MiUser['uri'];
};

type Option = {
	publishedAt?: Date | null;
	name?: string | null;
	text?: string | null;
	reply?: MiNote | null;
	renote?: MiNote | null;
	files?: MiDriveFile[] | null;
	poll?: IPoll | null;
	reactionAcceptance?: MiNote['reactionAcceptance'];
	cw?: string | null;
	channel?: MiChannel | null;
	apMentions?: MinimumUser[] | MiUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	uri?: string | null;
	url?: string | null;
};

@Injectable()
export class NoteEditService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	public static ContainsProhibitedWordsError = class extends Error { };

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.noteHistoriesRepository)
		private noteHistoriesRepository: NoteHistoriesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private queueService: QueueService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
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
		private utilityService: UtilityService,
		private userBlockingService: UserBlockingService,
		private moderationLogService: ModerationLogService,
		private userWebhookService: UserWebhookService,
	) { }

	@bindThis
	public async edit(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
		isCat: MiUser['isCat'];
	}, targetId: MiNote['id'], data: Option, silent = false, editor?: MiUser): Promise<MiNote> {
		const targetNote = await this.notesRepository.findOneByOrFail({ id: targetId });

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (targetNote == null) {
			throw new Error('No such note');
		}

		if ((await this.roleService.getUserPolicies(user.id)).canEditNote !== true) {
			throw new Error('Edit note is not allowed');
		}

		if (data.reply == null) data.reply = targetNote.reply;
		if (data.channel == null) data.channel = targetNote.channel;

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

		if (data.renote == null && targetNote.renoteId) data.renote = await this.notesRepository.findOneByOrFail({ id: targetNote.renoteId });
		if (data.reply == null && targetNote.replyId) data.reply = await this.notesRepository.findOneByOrFail({ id: targetNote.replyId });
		if (data.poll == null) data.poll = targetNote.hasPoll ? await this.pollsRepository.findOneByOrFail({ noteId: targetId }) : null;
		if (data.files == null) data.files = await this.driveFilesRepository.findBy({ id: In(targetNote.fileIds) });
		if (data.name == null) data.name = targetNote.name;
		if (data.reactionAcceptance == null) data.reactionAcceptance = targetNote.reactionAcceptance;
		const meta = await this.metaService.fetch();

		if (this.utilityService.isKeyWordIncluded(data.cw ?? data.text ?? '', meta.prohibitedWords)) {
			throw new NoteEditService.ContainsProhibitedWordsError();
		}

		let changeVisibilityToHome = false;

		const inSilencedInstance = this.utilityService.isSilencedHost(meta.silencedHosts, user.host);

		if (targetNote.visibility === 'public' && data.channel == null) {
			const sensitiveWords = meta.sensitiveWords;
			if (this.utilityService.isKeyWordIncluded(data.cw ?? data.text ?? '', sensitiveWords)) {
				changeVisibilityToHome = true;
			} else if ((await this.roleService.getUserPolicies(user.id)).canPublicNote === false) {
				changeVisibilityToHome = true;
			}
		} else if (inSilencedInstance) {
			changeVisibilityToHome = true;
		}

		// Check blocking
		if (data.renote && !this.noteEntityService.isQuote(data)) {
			if (data.renote.userHost === null) {
				if (data.renote.userId !== user.id) {
					const blocked = await this.userBlockingService.checkBlocked(data.renote.userId, user.id);
					if (blocked) {
						throw new Error('blocked');
					}
				}
			}
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

			mentionedUsers = data.apMentions ?? await this.noteEntityService.ExtractMentionedUsers(user, combinedTokens);
		}

		tags = tags.filter(tag => Array.from(tag).length <= 128).splice(0, 32);

		if (data.reply && (user.id !== data.reply.userId) && !mentionedUsers.some(u => u.id === data.reply!.userId)) {
			mentionedUsers.push(await this.usersRepository.findOneByOrFail({ id: data.reply!.userId }));
		}

		const note = new MiNote({
			id: targetNote.id,
			updatedAt: data.publishedAt ?? new Date(),
			visibility: changeVisibilityToHome ? 'home' : targetNote.visibility,
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
			reactionAcceptance: data.reactionAcceptance,
			attachedFileTypes: data.files ? data.files.map(file => file.type) : [],
			// 以下非正規化データ
			replyUserId: data.reply ? data.reply.userId : null,
			replyUserHost: data.reply ? data.reply.userHost : null,
			renoteUserId: data.renote ? data.renote.userId : null,
			renoteUserHost: data.renote ? data.renote.userHost : null,
			userHost: user.host,
		});

		if (data.uri != null) note.uri = data.uri;
		if (data.url != null) note.url = data.url;

		// Append mentions data
		if (mentionedUsers.length > 0) {
			note.mentions = mentionedUsers.map(u => u.id);
			const profiles = await this.userProfilesRepository.findBy({ userId: In(note.mentions) });
			note.mentionedRemoteUsers = JSON.stringify(mentionedUsers.filter(u => this.userEntityService.isRemoteUser(u)).map(u => {
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
			await this.notesRepository.update({ id: note.id }, note);
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
		this.noteHistoriesRepository.insert(new MiNoteHistory({
			id: this.idService.gen(),
			text: targetNote.text,
			cw: targetNote.cw,
			targetId: targetNote.id,
			fileIds: targetNote.fileIds,
			attachedFileTypes: targetNote.attachedFileTypes,
			mentions: targetNote.mentions,
			mentionedRemoteUsers: targetNote.mentionedRemoteUsers,
			emojis: targetNote.emojis,
			tags: targetNote.tags,
			hasPoll: targetNote.hasPoll,
		}));
		setImmediate('post updated', { signal: this.#shutdownController.signal }).then(
			async () => this.postNoteEdited((await this.notesRepository.findOneByOrFail({ id: note.id })), user, data, silent, tags!, mentionedUsers!),
			() => { /* aborted, ignore this */ },
		);
		if (editor && (note.userId !== editor.id)) {
			const user = await this.usersRepository.findOneByOrFail({ id: note.userId });
			this.moderationLogService.log(editor, 'editNote', {
				noteId: note.id,
				noteUserId: note.userId,
				noteUserUsername: user.username,
				noteUserHost: user.host,
				note: note,
				beforeNote: targetNote,
			});
		}
		return note;
	}

	@bindThis
	private async postNoteEdited(note: MiNote, user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
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

			// Pack the note
			const noteObj = await this.noteEntityService.pack(note, null, { skipHide: true, withReactionAndUserPairCache: true });

			this.userWebhookService.getActiveWebhooks().then(webhooks => {
				webhooks = webhooks.filter(x => x.userId === user.id && x.on.includes('note'));
				for (const webhook of webhooks) {
					this.queueService.userWebhookDeliver(webhook, 'note', {
						note: noteObj,
					});
				}
			});

			//#region AP deliver
			if (this.userEntityService.isLocalUser(user)) {
				(async () => {
					const noteActivity = await this.renderNoteOrRenoteActivity(data, note, user.id);
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
			this.channelsRepository.update(data.channel.id, {
				lastNotedAt: new Date(),
			});
		}

		// Register to search database
		this.index(note);
	}

	@bindThis
	private async renderNoteOrRenoteActivity(data: Option, note: MiNote, userId: string) {
		const content = this.apRendererService.renderNoteUpdate(await this.apRendererService.renderNote(note, false, true), { id: userId });

		return this.apRendererService.addContext(content);
	}

	@bindThis
	private index(note: MiNote) {
		if (note.text == null && note.cw == null) return;

		this.searchService.indexNote(note);
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
