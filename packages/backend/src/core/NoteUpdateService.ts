/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import util from 'util';
import { In, DataSource } from 'typeorm';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as mfm from 'mfm-js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { MiNote } from '@/models/Note.js';
import type { NotesRepository, UsersRepository } from '@/models/_.js';
import type { MiUser, MiLocalUser, MiRemoteUser } from '@/models/User.js';
import { RelayService } from '@/core/RelayService.js';
import { DI } from '@/di-symbols.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { bindThis } from '@/decorators.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { SearchService } from '@/core/SearchService.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { MiDriveFile } from '@/models/_.js';
import { MiPoll, IPoll } from '@/models/Poll.js';
import { concat } from '@/misc/prelude/array.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';

type MinimumUser = {
	id: MiUser['id'];
	host: MiUser['host'];
	username: MiUser['username'];
	uri: MiUser['uri'];
};

type Option = {
	updatedAt?: Date | null;
	files?: MiDriveFile[] | null;
	name?: string | null;
	text?: string | null;
	cw?: string | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	poll?: IPoll | null;
};

@Injectable()
export class NoteUpdateService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private relayService: RelayService,
		private apDeliverManagerService: ApDeliverManagerService,
		private apRendererService: ApRendererService,
		private searchService: SearchService,
		private activeUsersChart: ActiveUsersChart,
	) { }

	@bindThis
	public async update(user: {
		id: MiUser['id'];
		username: MiUser['username'];
		host: MiUser['host'];
		isBot: MiUser['isBot'];
	}, data: Option, note: MiNote, silent = false): Promise<MiNote | null> {
		if (data.updatedAt == null) data.updatedAt = new Date();

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

		// Parse MFM if needed
		if (!tags || !emojis) {
			const tokens = data.text ? mfm.parse(data.text)! : [];
			const cwTokens = data.cw ? mfm.parse(data.cw)! : [];
			const choiceTokens = data.poll && data.poll.choices
				? concat(data.poll.choices.map(choice => mfm.parse(choice)!))
				: [];

			const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

			tags = data.apHashtags ?? extractHashtags(combinedTokens);

			emojis = data.apEmojis ?? extractCustomEmojisFromMfm(combinedTokens);
		}

		tags = tags.filter(tag => Array.from(tag ?? '').length <= 128).splice(0, 32);

		const updatedNote = await this.updateNote(user, note, data, tags, emojis);

		if (updatedNote) {
			setImmediate('post updated', { signal: this.#shutdownController.signal }).then(
				() => this.postNoteUpdated(updatedNote, user, silent),
				() => { /* aborted, ignore this */ },
			);
		}

		return updatedNote;
	}

	@bindThis
	private async updateNote(user: {
		id: MiUser['id']; host: MiUser['host'];
		}, note: MiNote, data: Option, tags: string[], emojis: string[]): Promise<MiNote | null> {
		const updatedAtHistory = note.updatedAtHistory ? note.updatedAtHistory : [];

		const values = new MiNote({
			updatedAt: data.updatedAt!,
			fileIds: data.files ? data.files.map(file => file.id) : [],
			text: data.text,
			hasPoll: data.poll != null,
			cw: data.cw ?? null,
			tags: tags.map(tag => normalizeForSearch(tag)),
			emojis,
			attachedFileTypes: data.files ? data.files.map(file => file.type) : [],
			updatedAtHistory: [...updatedAtHistory, new Date()],
			noteEditHistory: [...note.noteEditHistory, (note.cw ? note.cw + '\n' : '') + note.text!],
		});

		// 投稿を更新
		try {
			if (note.hasPoll && values.hasPoll) {
				// Start transaction
				await this.db.transaction(async transactionalEntityManager => {
					await transactionalEntityManager.update(MiNote, { id: note.id }, values);

					if (values.hasPoll) {
						const old_poll = await transactionalEntityManager.findOneBy(MiPoll, { noteId: note.id });
						if (old_poll!.choices.toString() !== data.poll!.choices.toString() || old_poll!.multiple !== data.poll!.multiple) {
							await transactionalEntityManager.delete(MiPoll, { noteId: note.id });
							const poll = new MiPoll({
								noteId: note.id,
								choices: data.poll!.choices,
								expiresAt: data.poll!.expiresAt,
								multiple: data.poll!.multiple,
								votes: new Array(data.poll!.choices.length).fill(0),
								noteVisibility: note.visibility,
								userId: user.id,
								userHost: user.host,
							});
							await transactionalEntityManager.insert(MiPoll, poll);
						}
					}
				});
			} else if (!note.hasPoll && values.hasPoll) {
				// Start transaction
				await this.db.transaction(async transactionalEntityManager => {
					await transactionalEntityManager.update(MiNote, { id: note.id }, values);

					if (values.hasPoll) {
						const poll = new MiPoll({
							noteId: note.id,
							choices: data.poll!.choices,
							expiresAt: data.poll!.expiresAt,
							multiple: data.poll!.multiple,
							votes: new Array(data.poll!.choices.length).fill(0),
							noteVisibility: note.visibility,
							userId: user.id,
							userHost: user.host,
						});

						await transactionalEntityManager.insert(MiPoll, poll);
					}
				});
			} else if (note.hasPoll && !values.hasPoll) {
				// Start transaction
				await this.db.transaction(async transactionalEntityManager => {
					await transactionalEntityManager.update(MiNote, { id: note.id }, values);

					if (!values.hasPoll) {
						await transactionalEntityManager.delete(MiPoll, { noteId: note.id });
					}
				});
			} else {
				await this.notesRepository.update({ id: note.id }, values);
			}

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
		isBot: MiUser['isBot'];
	}, silent: boolean) {
		if (!silent) {
			if (this.userEntityService.isLocalUser(user)) this.activeUsersChart.write(user);

			this.globalEventService.publishNoteStream(note.id, 'updated', { cw: note.cw, text: note.text });

			//#region AP deliver
			if (this.userEntityService.isLocalUser(user)) {
				await (async () => {
					// @ts-ignore
					const noteActivity = await this.renderNoteActivity(note, user);

					await this.deliverToConcerned(user, note, noteActivity);
				})();
			}
			//#endregion
		}

		// Register to search database
		this.reIndex(note);
	}

	@bindThis
	private async renderNoteActivity(note: MiNote, user: MiUser) {
		const content = this.apRendererService.renderUpdate(await this.apRendererService.renderNote(note, false), user);

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
		console.log('deliverToConcerned', util.inspect(content, { depth: null }));
		await this.apDeliverManagerService.deliverToFollowers(user, content);
		await this.relayService.deliverToRelays(user, content);
		const remoteUsers = await this.getMentionedRemoteUsers(note);
		for (const remoteUser of remoteUsers) {
			await this.apDeliverManagerService.deliverToUser(user, content, remoteUser);
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
