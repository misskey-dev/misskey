import Bull from 'bull';
import { LessThan } from 'typeorm';
import { UserIps } from '@/models/index.js';

import { queueLogger } from '../../logger.js';

const logger = queueLogger.createSubLogger('clean');

export async function clean(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info('Cleaning...');

	UserIps.delete({
		createdAt: LessThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 90))),
	});

	logger.succ('Cleaned.');
	done();
}
