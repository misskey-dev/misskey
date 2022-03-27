import Bull from 'bull';

import { queueLogger } from '../../logger.js';
import { deleteFileSync } from '@/services/drive/delete-file.js';
import { DriveFiles } from '@/models/index.js';
import { MoreThan, Not, IsNull } from 'typeorm';

const logger = queueLogger.createSubLogger('clean-remote-files');

export default async function cleanRemoteFiles(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info(`Deleting cached remote files...`);

	let deletedCount = 0;
	let cursor: any = null;

	while (true) {
		const files = await DriveFiles.find({
			where: {
				userHost: Not(IsNull()),
				isLink: false,
				...(cursor ? { id: MoreThan(cursor) } : {}),
			},
			take: 8,
			order: {
				id: 1,
			},
		});

		if (files.length === 0) {
			job.progress(100);
			break;
		}

		cursor = files[files.length - 1].id;

		await Promise.all(files.map(file => deleteFileSync(file, true)));

		deletedCount += 8;

		const total = await DriveFiles.countBy({
			userHost: Not(IsNull()),
			isLink: false,
		});

		job.progress(deletedCount / total);
	}

	logger.succ(`All cahced remote files has been deleted.`);
	done();
}
