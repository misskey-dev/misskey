import * as Bull from 'bull';
import { queueLogger } from '../../../logger';
import { Users } from '@/models/index';
import { DbUserJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('delete-account:delete-account');

export async function deleteAccount_deleteAccount(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Deleting account of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	await Users.delete(job.data.user.id);

	logger.succ(`Account deleted`);

	done();
}
