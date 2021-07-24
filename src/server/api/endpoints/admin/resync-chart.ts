import define from '../../define';
import { driveChart, notesChart, usersChart, instanceChart } from '../../../../services/chart';
import { insertModerationLog } from '../../../../services/insert-moderation-log';

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
