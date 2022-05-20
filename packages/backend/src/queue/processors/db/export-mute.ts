import Bull from 'bull';
import * as fs from 'node:fs';

import { queueLogger } from '../../logger.js';
import { addFile } from '@/services/drive/add-file.js';
import { format as dateFormat } from 'date-fns';
import { getFullApAccount } from '@/misc/convert-host.js';
import { createTemp } from '@/misc/create-temp.js';
import { Users, Mutings } from '@/models/index.js';
import { IsNull, MoreThan } from 'typeorm';
import { DbUserJobData } from '@/queue/types.js';

const logger = queueLogger.createSubLogger('export-mute');

export async function exportMute(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting mute of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		const stream = fs.createWriteStream(path, { flags: 'a' });

		let exportedCount = 0;
		let cursor: any = null;

		while (true) {
			const mutes = await Mutings.find({
				where: {
					muterId: user.id,
					expiresAt: IsNull(),
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
			});

			if (mutes.length === 0) {
				job.progress(100);
				break;
			}

			cursor = mutes[mutes.length - 1].id;

			for (const mute of mutes) {
				const u = await Users.findOneBy({ id: mute.muteeId });
				if (u == null) {
					exportedCount++; continue;
				}

				const content = getFullApAccount(u.username, u.host);
				await new Promise<void>((res, rej) => {
					stream.write(content + '\n', err => {
						if (err) {
							logger.error(err);
							rej(err);
						} else {
							res();
						}
					});
				});
				exportedCount++;
			}

			const total = await Mutings.countBy({
				muterId: user.id,
			});

			job.progress(exportedCount / total);
		}

		stream.end();
		logger.succ(`Exported to: ${path}`);

		const fileName = 'mute-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
		const driveFile = await addFile({ user, path, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
	} finally {
		cleanup();
	}

	done();
}
