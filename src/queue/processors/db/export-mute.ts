import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { queueLogger } from '../../logger';
import addFile from '@/services/drive/add-file';
import dateFormat from 'dateformat';
import { getFullApAccount } from '@/misc/convert-host';
import { Users, Mutings } from '@/models/index';
import { MoreThan } from 'typeorm';
import { DbUserJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('export-mute');

export async function exportMute(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting mute of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	const stream = fs.createWriteStream(path, { flags: 'a' });

	let exportedCount = 0;
	let cursor: any = null;

	while (true) {
		const mutes = await Mutings.find({
			where: {
				muterId: user.id,
				...(cursor ? { id: MoreThan(cursor) } : {})
			},
			take: 100,
			order: {
				id: 1
			}
		});

		if (mutes.length === 0) {
			job.progress(100);
			break;
		}

		cursor = mutes[mutes.length - 1].id;

		for (const mute of mutes) {
			const u = await Users.findOne({ id: mute.muteeId });
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

		const total = await Mutings.count({
			muterId: user.id,
		});

		job.progress(exportedCount / total);
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'mute-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile.id}`);
	cleanup();
	done();
}
