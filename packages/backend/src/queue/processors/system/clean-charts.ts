import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import { activeUsersChart, driveChart, federationChart, hashtagChart, instanceChart, networkChart, notesChart, perUserDriveChart, perUserFollowingChart, perUserNotesChart, perUserReactionsChart, usersChart } from '@/services/chart/index';

const logger = queueLogger.createSubLogger('clean-charts');

export async function cleanCharts(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info(`Resync charts...`);

	await Promise.all([
		federationChart.clean(),
		notesChart.clean(),
		usersChart.clean(),
		networkChart.clean(),
		activeUsersChart.clean(),
		instanceChart.clean(),
		perUserNotesChart.clean(),
		driveChart.clean(),
		perUserReactionsChart.clean(),
		hashtagChart.clean(),
		perUserFollowingChart.clean(),
		perUserDriveChart.clean(),
	]);

	logger.succ(`All charts successfully cleaned.`);
	done();
}
