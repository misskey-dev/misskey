import define from '../../define.js';
import { driveChart, notesChart, usersChart, instanceChart } from '@/services/chart/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps, me) => {
	insertModerationLog(me, 'chartResync');

	driveChart.resync();
	notesChart.resync();
	usersChart.resync();
	instanceChart.resync();

	// TODO: ユーザーごとのチャートもキューに入れて更新する
});
