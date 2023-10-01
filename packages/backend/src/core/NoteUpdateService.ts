/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import { In, DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { MiNote } from '@/models/Note.js';
import type { ChannelsRepository, FollowingsRepository, InstancesRepository, MutedNotesRepository, MutingsRepository, NotesRepository, NoteThreadMutingsRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser, MiLocalUser, MiRemoteUser } from '@/models/User.js';
import { RelayService } from '@/core/RelayService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
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

type Option = {
	updatedAt?: Date | null;
	text: string | null;
	cw: string | null;
};

@Injectable()
export class NoteUpdateService implements OnApplicationShutdown {
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
		private remoteUserResolveService: RemoteUserResolveService,
		private apDeliverManagerService: ApDeliverManagerService,
		private apRendererService: ApRendererService,
		private roleService: RoleService,
		private metaService: MetaService,
		private searchService: SearchService,
		private activeUsersChart: ActiveUsersChart,
	) { }

	@bindThis
	public async update(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		createdAt: MiUser['createdAt'];
		isBot: MiUser['isBot'];
	}, data: Option, note: MiNote, silent = false): Promise<MiNote> {
		if (data.updatedAt == null) data.updatedAt = new Date();

		if (data.text) {
			if (data.text.length > DB_MAX_NOTE_TEXT_LENGTH) {
				data.text = data.text.slice(0, DB_MAX_NOTE_TEXT_LENGTH);
			}
			data.text = data.text.trim();
		} else {
			data.text = null;
		}

		const updatedNote = await this.updateNote(user, note, data);

		if (updatedNote) {
			setImmediate('post updated', { signal: this.#shutdownController.signal }).then(
				() => this.postNoteUpdated(updatedNote, user, silent),
				() => { /* aborted, ignore this */ },
			);
		}

		return note;
	}

	@bindThis
	private async updateNote(user: { id: MiUser['id']; host: MiUser['host']; }, note: MiNote, data: Option) {
		const values = {
			updatedAt: data.updatedAt!,
			text: data.text,
			cw: data.cw ?? null,
		};

		// 投稿を更新
		try {
			await this.notesRepository.update({ id: note.id }, values);

			return await this.notesRepository.findOneBy({ id: note.id });
		} catch (e) {
			console.error(e);

			throw e;
		}
	}

	@bindThis
	private async postNoteUpdated(note: MiNote, user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		createdAt: MiUser['createdAt'];
		isBot: MiUser['isBot'];
	}, silent: boolean) {
		if (!silent) {
			if (this.userEntityService.isLocalUser(user)) this.activeUsersChart.write(user);

			this.globalEventService.publishNoteStream(note.id, 'updated', { cw: note.cw, text: note.text });

			//#region AP deliver
			if (this.userEntityService.isLocalUser(user)) {
				(async () => {
					const noteActivity = await this.renderNoteActivity(note);

					this.deliverToConcerned(user, note, noteActivity);
				})();
			}
			//#endregion
		}

		// Register to search database
		this.reIndex(note);
	}

	@bindThis
	private async renderNoteActivity(note: MiNote) {
		const content = this.apRendererService.renderUpdate(await this.apRendererService.renderNote(note, false), note);

		return this.apRendererService.addContext(content);
	}

	@bindThis
	private async getMentionedRemoteUsers(note: MiNote) {
		const where = [] as any[];

		// mention / reply / dm
		const uris = (JSON.parse(note.mentionedRemoteUsers) as IMentionedRemoteUsers).map(x => x.uri);
		if (uris.length > 0) {
			where.push(
				{ uri: In(uris) },
			);
		}

		// renote / quote
		if (note.renoteUserId) {
			where.push({
				id: note.renoteUserId,
			});
		}

		if (where.length === 0) return [];

		return await this.usersRepository.find({
			where,
		}) as MiRemoteUser[];
	}

	@bindThis
	private async deliverToConcerned(user: { id: MiLocalUser['id']; host: null; }, note: MiNote, content: any) {
		this.apDeliverManagerService.deliverToFollowers(user, content);
		this.relayService.deliverToRelays(user, content);
		const remoteUsers = await this.getMentionedRemoteUsers(note);
		for (const remoteUser of remoteUsers) {
			this.apDeliverManagerService.deliverToUser(user, content, remoteUser);
		}
	}

	@bindThis
	private reIndex(note: MiNote) {
		if (note.text == null && note.cw == null) return;

		this.searchService.unindexNote(note);
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
