import * as Bull from 'bull';
import { MoreThan } from 'typeorm';
import { queueLogger } from '../../../logger';
import { Users, DriveFiles } from '@/models/index';
import { DbUserJobData } from '@/queue/types';
import { deleteAccountJobs } from '@/queue';
import { deleteFileSync } from '@/services/drive/delete-file';
import { DriveFile } from '@/models/entities/drive-file';

const logger = queueLogger.createSubLogger('delete-account:delete-files');

export async function deleteAccount_deleteFiles(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Deleting files of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	let deletedFilesCount = 0;
	let cursor: DriveFile['id'] | null = null;

	while (true) {
		const files = await DriveFiles.find({
			where: {
				userId: user.id,
				...(cursor ? { id: MoreThan(cursor) } : {})
			},
			take: 10,
			order: {
				id: 1
			}
		});

		if (files.length === 0) {
			job.progress(100);
			break;
		}

		cursor = files[files.length - 1].id;

		for (const file of files) {
			await deleteFileSync(file);
			deletedFilesCount++;
		}

		const total = await DriveFiles.count({
			userId: user.id,
		});

		job.progress(deletedFilesCount / total);
	}

	logger.succ(`All of files deleted`);

	deleteAccountJobs.finishDeleteAccountJobs(job.data.user);

	done();
}
