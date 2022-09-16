import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { DriveFiles, UserProfiles } from '@/models/index.js';
import { Notes, Users } from '@/models/index.js';
import { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/services/DriveService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Note } from '@/models/entities/Note.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbUserDeleteJobData } from '../types.js';

@Injectable()
export class DeleteAccountProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.#logger = this.queueLoggerService.logger.createSubLogger('delete-account');
	}

	public async process(job: Bull.Job<DbUserDeleteJobData>): Promise<string | void> {
		this.#logger.info(`Deleting account of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		{ // Delete notes
			let cursor: Note['id'] | null = null;

			while (true) {
				const notes = await this.notesRepository.find({
					where: {
						userId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				}) as Note[];

				if (notes.length === 0) {
					break;
				}

				cursor = notes[notes.length - 1].id;

				await Notes.delete(notes.map(note => note.id));
			}

			this.#logger.succ('All of notes deleted');
		}

		{ // Delete files
			let cursor: DriveFile['id'] | null = null;

			while (true) {
				const files = await this.driveFilesRepository.find({
					where: {
						userId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 10,
					order: {
						id: 1,
					},
				}) as DriveFile[];

				if (files.length === 0) {
					break;
				}

				cursor = files[files.length - 1].id;

				for (const file of files) {
					await this.driveService.deleteFileSync(file);
				}
			}

			this.#logger.succ('All of files deleted');
		}

		{ // Send email notification
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			if (profile.email && profile.emailVerified) {
				sendEmail(profile.email, 'Account deleted',
					'Your account has been deleted.',
					'Your account has been deleted.');
			}
		}

		// soft指定されている場合は物理削除しない
		if (job.data.soft) {
		// nop
		} else {
			await Users.delete(job.data.user.id);
		}

		return 'Account deleted';
	}
}
