/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiNote } from '@/models/Note.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { NoteUnreadsRepository, MutingsRepository, NoteThreadMutingsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { trackPromise } from '@/misc/promise-tracker.js';

@Injectable()
export class NoteReadService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.noteUnreadsRepository)
		private noteUnreadsRepository: NoteUnreadsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async insertNoteUnread(userId: MiUser['id'], note: MiNote, params: {
		// NOTE: isSpecifiedがtrueならisMentionedは必ずfalse
		isSpecified: boolean;
		isMentioned: boolean;
	}): Promise<void> {
		//#region ミュートしているなら無視
		const mute = await this.mutingsRepository.findBy({
			muterId: userId,
		});
		if (mute.map(m => m.muteeId).includes(note.userId)) return;
		//#endregion

		// スレッドミュート
		const isThreadMuted = await this.noteThreadMutingsRepository.exists({
			where: {
				userId: userId,
				threadId: note.threadId ?? note.id,
			},
		});
		if (isThreadMuted) return;

		const unread = {
			id: this.idService.gen(),
			noteId: note.id,
			userId: userId,
			isSpecified: params.isSpecified,
			isMentioned: params.isMentioned,
			noteUserId: note.userId,
		};

		await this.noteUnreadsRepository.insert(unread);

		// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
		setTimeout(2000, 'unread note', { signal: this.#shutdownController.signal }).then(async () => {
			const exist = await this.noteUnreadsRepository.exists({ where: { id: unread.id } });

			if (!exist) return;

			if (params.isMentioned) {
				this.globalEventService.publishMainStream(userId, 'unreadMention', note.id);
			}
			if (params.isSpecified) {
				this.globalEventService.publishMainStream(userId, 'unreadSpecifiedNote', note.id);
			}
		}, () => { /* aborted, ignore it */ });
	}

	@bindThis
	public async read(
		userId: MiUser['id'],
		notes: (MiNote | Packed<'Note'>)[],
	): Promise<void> {
		if (notes.length === 0) return;

		const noteIds = new Set<MiNote['id']>();

		for (const note of notes) {
			if (note.mentions && note.mentions.includes(userId)) {
				noteIds.add(note.id);
			} else if (note.visibleUserIds && note.visibleUserIds.includes(userId)) {
				noteIds.add(note.id);
			}
		}

		if (noteIds.size === 0) return;

		// Remove the record
		await this.noteUnreadsRepository.delete({
			userId: userId,
			noteId: In(Array.from(noteIds)),
		});

		// TODO: ↓まとめてクエリしたい

		trackPromise(this.noteUnreadsRepository.countBy({
			userId: userId,
			isMentioned: true,
		}).then(mentionsCount => {
			if (mentionsCount === 0) {
				// 全て既読になったイベントを発行
				this.globalEventService.publishMainStream(userId, 'readAllUnreadMentions');
			}
		}));

		trackPromise(this.noteUnreadsRepository.countBy({
			userId: userId,
			isSpecified: true,
		}).then(specifiedCount => {
			if (specifiedCount === 0) {
				// 全て既読になったイベントを発行
				this.globalEventService.publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
			}
		}));
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
