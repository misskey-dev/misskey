import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { In, MoreThan, Not } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { Followings, Mutings } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type Logger from '@/logger.js';
import type { DriveService } from '@/services/drive/DriveService.js';
import { getFullApAccount } from '@/misc/convert-host.js';
import { createTemp } from '@/misc/create-temp.js';
import type { Following } from '@/models/entities/following.js';
import type Bull from 'bull';
import type { DbUserJobData } from '../types.js';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class ExportFollowingProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('export-following');
	}

	public async process(job: Bull.Job<DbUserJobData>, done: () => void): Promise<void> {
		this.#logger.info(`Exporting following of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.#logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			let cursor: Following['id'] | null = null;

			const mutings = job.data.excludeMuting ? await this.mutingsRepository.findBy({
				muterId: user.id,
			}) : [];

			while (true) {
				const followings = await this.followingsRepository.find({
					where: {
						followerId: user.id,
						...(mutings.length > 0 ? { followeeId: Not(In(mutings.map(x => x.muteeId))) } : {}),
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				}) as Following[];

				if (followings.length === 0) {
					break;
				}

				cursor = followings[followings.length - 1].id;

				for (const following of followings) {
					const u = await Users.findOneBy({ id: following.followeeId });
					if (u == null) {
						continue;
					}

					if (job.data.excludeInactive && u.updatedAt && (Date.now() - u.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 90)) {
						continue;
					}

					const content = getFullApAccount(u.username, u.host);
					await new Promise<void>((res, rej) => {
						stream.write(content + '\n', err => {
							if (err) {
								this.#logger.error(err);
								rej(err);
							} else {
								res();
							}
						});
					});
				}
			}

			stream.end();
			this.#logger.succ(`Exported to: ${path}`);

			const fileName = 'following-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true });

			this.#logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}

		done();
	}
}
