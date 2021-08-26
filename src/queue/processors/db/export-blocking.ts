import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { queueLogger } from '../../logger';
import addFile from '@/services/drive/add-file';
import dateFormat from 'dateformat';
import { getFullApAccount } from '@/misc/convert-host';
import { Users, Blockings } from '@/models/index';
import { MoreThan } from 'typeorm';
import { DbUserJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('export-blocking');

export async function exportBlocking(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting blocking of ${job.data.user.id} ...`);

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
		const blockings = await Blockings.find({
			where: {
				blockerId: user.id,
				...(cursor ? { id: MoreThan(cursor) } : {})
			},
			take: 100,
			order: {
				id: 1
			}
		});

		if (blockings.length === 0) {
			job.progress(100);
			break;
		}

		cursor = blockings[blockings.length - 1].id;

		for (const block of blockings) {
			const u = await Users.findOne({ id: block.blockeeId });
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

		const total = await Blockings.count({
			blockerId: user.id,
		});

		job.progress(exportedCount / total);
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'blocking-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile.id}`);
	cleanup();
	done();
}
