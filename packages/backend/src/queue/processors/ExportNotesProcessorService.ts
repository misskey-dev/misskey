/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ReadableStream, TextEncoderStream } from 'node:stream/web';
import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, PollsRepository, UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp } from '@/misc/create-temp.js';
import type { MiPoll } from '@/models/Poll.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { JsonArrayStream } from '@/misc/JsonArrayStream.js';
import { FileWriterStream } from '@/misc/FileWriterStream.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbJobDataWithUser } from '../types.js';

class NoteStream extends ReadableStream<Record<string, unknown>> {
	constructor(
		job: Bull.Job,
		notesRepository: NotesRepository,
		pollsRepository: PollsRepository,
		driveFileEntityService: DriveFileEntityService,
		idService: IdService,
		userId: string,
	) {
		let exportedNotesCount = 0;
		let cursor: MiNote['id'] | null = null;

		const serialize = (
			note: MiNote,
			poll: MiPoll | null,
			files: Packed<'DriveFile'>[],
		): Record<string, unknown> => {
			return {
				id: note.id,
				text: note.text,
				createdAt: idService.parse(note.id).date.toISOString(),
				fileIds: note.fileIds,
				files: files,
				replyId: note.replyId,
				renoteId: note.renoteId,
				poll: poll,
				cw: note.cw,
				visibility: note.visibility,
				visibleUserIds: note.visibleUserIds,
				localOnly: note.localOnly,
				reactionAcceptance: note.reactionAcceptance,
			};
		};

		super({
			async pull(controller): Promise<void> {
				const notes = await notesRepository.find({
					where: {
						userId,
						...(cursor !== null ? { id: MoreThan(cursor) } : {}),
					},
					take: 100, // 100件ずつ取得
					order: { id: 1 },
				});

				if (notes.length === 0) {
					job.updateProgress(100);
					controller.close();
				}

				cursor = notes.at(-1)?.id ?? null;

				for (const note of notes) {
					const poll = note.hasPoll
						? await pollsRepository.findOneByOrFail({ noteId: note.id }) // N+1
						: null;
					const files = await driveFileEntityService.packManyByIds(note.fileIds); // N+1
					const content = serialize(note, poll, files);

					controller.enqueue(content);
					exportedNotesCount++;
				}

				const total = await notesRepository.countBy({ userId });
				job.updateProgress(exportedNotesCount / total);
			},
		});
	}
}

@Injectable()
export class ExportNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
		private notificationService: NotificationService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-notes');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>): Promise<void> {
		this.logger.info(`Exporting notes of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			// メモリが足りなくならないようにストリームで処理する
			await new NoteStream(
				job,
				this.notesRepository,
				this.pollsRepository,
				this.driveFileEntityService,
				this.idService,
				user.id,
			)
				.pipeThrough(new JsonArrayStream())
				.pipeThrough(new TextEncoderStream())
				.pipeTo(new FileWriterStream(path));

			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'notes-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'json' });

			this.logger.succ(`Exported to: ${driveFile.id}`);

			this.notificationService.createNotification(user.id, 'exportCompleted', {
				exportedEntity: 'note',
				fileId: driveFile.id,
			});
		} finally {
			cleanup();
		}
	}
}
