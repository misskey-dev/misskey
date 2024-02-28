/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Writable } from 'node:stream';
import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { ClipNotesRepository, ClipsRepository, MiClip, MiClipNote, MiUser, NotesRepository, PollsRepository, UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp } from '@/misc/create-temp.js';
import type { MiPoll } from '@/models/Poll.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbJobDataWithUser } from '../types.js';

@Injectable()
export class ExportClipsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-clips');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>): Promise<void> {
		this.logger.info(`Exporting clips of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = Writable.toWeb(fs.createWriteStream(path, { flags: 'a' }));
			const writer = stream.getWriter();
			writer.closed.catch(this.logger.error);

			await writer.write('[');

			await this.processClips(writer, user, job);

			await writer.write(']');
			await writer.close();

			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'clips-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'json' });

			this.logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}
	}

	async processClips(writer: WritableStreamDefaultWriter, user: MiUser, job: Bull.Job<DbJobDataWithUser>) {
		let exportedClipsCount = 0;
		let cursor: MiClip['id'] | null = null;

		while (true) {
			const clips = await this.clipsRepository.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
			});

			if (clips.length === 0) {
				job.updateProgress(100);
				break;
			}

			cursor = clips.at(-1)?.id ?? null;

			for (const clip of clips) {
				// Stringify but remove the last `]}`
				const content = JSON.stringify(this.serializeClip(clip)).slice(0, -2);
				const isFirst = exportedClipsCount === 0;
				await writer.write(isFirst ? content : ',\n' + content);

				await this.processClipNotes(writer, clip.id);

				await writer.write(']}');
				exportedClipsCount++;
			}

			const total = await this.clipsRepository.countBy({
				userId: user.id,
			});

			job.updateProgress(exportedClipsCount / total);
		}
	}

	async processClipNotes(writer: WritableStreamDefaultWriter, clipId: string): Promise<void> {
		let exportedClipNotesCount = 0;
		let cursor: MiClipNote['id'] | null = null;

		while (true) {
			const clipNotes = await this.clipNotesRepository.find({
				where: {
					clipId,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
				relations: ['note', 'note.user'],
			}) as (MiClipNote & { note: MiNote & { user: MiUser } })[];

			if (clipNotes.length === 0) {
				break;
			}

			cursor = clipNotes.at(-1)?.id ?? null;

			for (const clipNote of clipNotes) {
				let poll: MiPoll | undefined;
				if (clipNote.note.hasPoll) {
					poll = await this.pollsRepository.findOneByOrFail({ noteId: clipNote.note.id });
				}
				const content = JSON.stringify(this.serializeClipNote(clipNote, poll));
				const isFirst = exportedClipNotesCount === 0;
				await writer.write(isFirst ? content : ',\n' + content);

				exportedClipNotesCount++;
			}
		}
	}

	private serializeClip(clip: MiClip): Record<string, unknown> {
		return {
			id: clip.id,
			name: clip.name,
			description: clip.description,
			lastClippedAt: clip.lastClippedAt?.toISOString(),
			clipNotes: [],
		};
	}

	private serializeClipNote(clip: MiClipNote & { note: MiNote & { user: MiUser } }, poll: MiPoll | undefined): Record<string, unknown> {
		return {
			id: clip.id,
			createdAt: this.idService.parse(clip.id).date.toISOString(),
			note: {
				id: clip.note.id,
				text: clip.note.text,
				createdAt: this.idService.parse(clip.note.id).date.toISOString(),
				fileIds: clip.note.fileIds,
				replyId: clip.note.replyId,
				renoteId: clip.note.renoteId,
				poll: poll,
				cw: clip.note.cw,
				visibility: clip.note.visibility,
				visibleUserIds: clip.note.visibleUserIds,
				localOnly: clip.note.localOnly,
				reactionAcceptance: clip.note.reactionAcceptance,
				uri: clip.note.uri,
				url: clip.note.url,
				user: {
					id: clip.note.user.id,
					name: clip.note.user.name,
					username: clip.note.user.username,
					host: clip.note.user.host,
					uri: clip.note.user.uri,
				},
			},
		};
	}
}
