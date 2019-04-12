import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import deleteFile from '../../../services/drive/delete-file';
import { Users, DriveFiles } from '../../../models';
import { MoreThan } from 'typeorm';

const logger = queueLogger.createSubLogger('delete-drive-files');

export async function deleteDriveFiles(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Deleting drive files of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	let deletedCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const files = await DriveFiles.find({
			where: {
				userId: user.id,
				...(cursor ? { id: MoreThan(cursor) } : {})
			},
			take: 100,
			order: {
				id: 1
			}
		});

		if (files.length === 0) {
			ended = true;
			job.progress(100);
			break;
		}

		cursor = files[files.length - 1].id;

		for (const file of files) {
			await deleteFile(file);
			deletedCount++;
		}

		const total = await DriveFiles.count({
			userId: user.id,
		});

		job.progress(deletedCount / total);
	}

	logger.succ(`All drive files (${deletedCount}) of ${user.id} has been deleted.`);
	done();
}
