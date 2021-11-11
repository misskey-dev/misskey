import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import { driveChart, notesChart, usersChart } from '@/services/chart/index';

const logger = queueLogger.createSubLogger('resync-charts');

export default async function resyncCharts(job: Bull.Job<{}>, done: any): Promise<void> {
	logger.info(`Resync charts...`);

	// TODO: ユーザーごとのチャートも更新する
	// TODO: インスタンスごとのチャートも更新する
	await Promise.all([
		driveChart.resync(),
		notesChart.resync(),
		usersChart.resync(),
	]);

	logger.succ(`All charts successfully resynced.`);
	done();
}
