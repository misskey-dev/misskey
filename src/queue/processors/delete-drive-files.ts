import * as bq from 'bee-queue';
import * as mongo from 'mongodb';

import { queueLogger } from '../logger';
import User from '../../models/user';
import DriveFile from '../../models/drive-file';
import deleteFile from '../../services/drive/delete-file';

const logger = queueLogger.createSubLogger('delete-drive-files');

export async function deleteDriveFiles(job: bq.Job, done: any): Promise<void> {
	logger.info(`Deleting drive files of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	let deletedCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const files = await DriveFile.find({
			userId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (files.length === 0) {
			ended = true;
			if (job.reportProgress) job.reportProgress(100);
			break;
		}

		cursor = files[files.length - 1]._id;

		for (const file of files) {
			await deleteFile(file);
			deletedCount++;
		}

		const total = await DriveFile.count({
			userId: user._id,
		});

		if (job.reportProgress) job.reportProgress(deletedCount / total);
	}

	logger.succ(`All drive files (${deletedCount}) of ${user._id} has been deleted.`);
	done();
}
