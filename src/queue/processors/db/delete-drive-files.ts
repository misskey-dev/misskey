import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import User from '../../../models/user';
import DriveFile from '../../../models/drive-file';
import deleteFile from '../../../services/drive/delete-file';

const logger = queueLogger.createSubLogger('delete-drive-files');

export async function deleteDriveFiles(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Deleting drive files of ${job.data.user.id} ...`);

	const user = await Users.findOne({
		id: new mongo.ObjectID(job.data.user.id)
	});

	let deletedCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const files = await DriveFile.find({
			userId: user.id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
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

		const total = await DriveFile.count({
			userId: user.id,
		});

		job.progress(deletedCount / total);
	}

	logger.succ(`All drive files (${deletedCount}) of ${user.id} has been deleted.`);
	done();
}
