/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { MiNoteFavorite, NoteFavoritesRepository, PollsRepository, MiUser, UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp } from '@/misc/create-temp.js';
import type { MiPoll } from '@/models/Poll.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbJobDataWithUser } from '../types.js';

@Injectable()
export class ExportFavoritesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-favorites');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>): Promise<void> {
		this.logger.info(`Exporting favorites of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			const write = (text: string): Promise<void> => {
				return new Promise<void>((res, rej) => {
					stream.write(text, err => {
						if (err) {
							this.logger.error(err);
							rej(err);
						} else {
							res();
						}
					});
				});
			};

			await write('[');

			let exportedFavoritesCount = 0;
			let cursor: MiNoteFavorite['id'] | null = null;

			while (true) {
				const favorites = await this.noteFavoritesRepository.find({
					where: {
						userId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
					relations: ['note', 'note.user'],
				}) as (MiNoteFavorite & { note: MiNote & { user: MiUser } })[];

				if (favorites.length === 0) {
					job.updateProgress(100);
					break;
				}

				cursor = favorites.at(-1)?.id ?? null;

				for (const favorite of favorites) {
					let poll: MiPoll | undefined;
					if (favorite.note.hasPoll) {
						poll = await this.pollsRepository.findOneByOrFail({ noteId: favorite.note.id });
					}
					const content = JSON.stringify(this.serialize(favorite, poll));
					const isFirst = exportedFavoritesCount === 0;
					await write(isFirst ? content : ',\n' + content);
					exportedFavoritesCount++;
				}

				const total = await this.noteFavoritesRepository.countBy({
					userId: user.id,
				});

				job.updateProgress(exportedFavoritesCount / total);
			}

			await write(']');

			stream.end();
			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'favorites-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'json' });

			this.logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}
	}

	private serialize(favorite: MiNoteFavorite & { note: MiNote & { user: MiUser } }, poll: MiPoll | null = null): Record<string, unknown> {
		return {
			id: favorite.id,
			createdAt: this.idService.parse(favorite.id).date.toISOString(),
			note: {
				id: favorite.note.id,
				text: favorite.note.text,
				createdAt: this.idService.parse(favorite.note.id).date.toISOString(),
				fileIds: favorite.note.fileIds,
				replyId: favorite.note.replyId,
				renoteId: favorite.note.renoteId,
				poll: poll,
				cw: favorite.note.cw,
				visibility: favorite.note.visibility,
				visibleUserIds: favorite.note.visibleUserIds,
				localOnly: favorite.note.localOnly,
				reactionAcceptance: favorite.note.reactionAcceptance,
				uri: favorite.note.uri,
				url: favorite.note.url,
				user: {
					id: favorite.note.user.id,
					name: favorite.note.user.name,
					username: favorite.note.user.username,
					host: favorite.note.user.host,
					uri: favorite.note.user.uri,
				},
			},
		};
	}
}
