import define from '../../define';
import { driveChart, notesChart, usersChart } from '@/services/chart/index';
import { insertModerationLog } from '@/services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	insertModerationLog(me, 'chartResync');

	driveChart.resync();
	notesChart.resync();
	usersChart.resync();

	// TODO: ユーザーごとのチャートもキューに入れて更新する
	// TODO: インスタンスごとのチャートもキューに入れて更新する
});
