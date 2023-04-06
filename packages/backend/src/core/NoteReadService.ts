import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import type { Packed } from '@/misc/json-schema.js';
import type { Note } from '@/models/entities/Note.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { NoteUnreadsRepository, MutingsRepository, NoteThreadMutingsRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';

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
	public async insertNoteUnread(userId: User['id'], note: Note, params: {
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
		const threadMute = await this.noteThreadMutingsRepository.findOneBy({
			userId: userId,
			threadId: note.threadId ?? note.id,
		});
		if (threadMute) return;

		const unread = {
			id: this.idService.genId(),
			noteId: note.id,
			userId: userId,
			isSpecified: params.isSpecified,
			isMentioned: params.isMentioned,
			noteUserId: note.userId,
		};

		await this.noteUnreadsRepository.insert(unread);

		// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
		setTimeout(2000, 'unread note', { signal: this.#shutdownController.signal }).then(async () => {
			const exist = await this.noteUnreadsRepository.findOneBy({ id: unread.id });

			if (exist == null) return;

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
		userId: User['id'],
		notes: (Note | Packed<'Note'>)[],
	): Promise<void> {
		const readMentions: (Note | Packed<'Note'>)[] = [];
		const readSpecifiedNotes: (Note | Packed<'Note'>)[] = [];

		for (const note of notes) {
			if (note.mentions && note.mentions.includes(userId)) {
				readMentions.push(note);
			} else if (note.visibleUserIds && note.visibleUserIds.includes(userId)) {
				readSpecifiedNotes.push(note);
			}
		}

		if ((readMentions.length > 0) || (readSpecifiedNotes.length > 0)) {
			// Remove the record
			await this.noteUnreadsRepository.delete({
				userId: userId,
				noteId: In([...readMentions.map(n => n.id), ...readSpecifiedNotes.map(n => n.id)]),
			});

			// TODO: ↓まとめてクエリしたい
	
			this.noteUnreadsRepository.countBy({
				userId: userId,
				isMentioned: true,
			}).then(mentionsCount => {
				if (mentionsCount === 0) {
					// 全て既読になったイベントを発行
					this.globalEventService.publishMainStream(userId, 'readAllUnreadMentions');
				}
			});
	
			this.noteUnreadsRepository.countBy({
				userId: userId,
				isSpecified: true,
			}).then(specifiedCount => {
				if (specifiedCount === 0) {
					// 全て既読になったイベントを発行
					this.globalEventService.publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
				}
			});
		}
	}

	onApplicationShutdown(signal?: string | undefined): void {
		this.#shutdownController.abort();
	}
}
