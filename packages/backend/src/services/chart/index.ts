import { beforeShutdown } from '@/misc/before-shutdown';

import FederationChart from './charts/federation';
import NotesChart from './charts/notes';
import UsersChart from './charts/users';
import ActiveUsersChart from './charts/active-users';
import InstanceChart from './charts/instance';
import PerUserNotesChart from './charts/per-user-notes';
import DriveChart from './charts/drive';
import PerUserReactionsChart from './charts/per-user-reactions';
import HashtagChart from './charts/hashtag';
import PerUserFollowingChart from './charts/per-user-following';
import PerUserDriveChart from './charts/per-user-drive';
import ApRequestChart from './charts/ap-request';

export const federationChart = new FederationChart();
export const notesChart = new NotesChart();
export const usersChart = new UsersChart();
export const activeUsersChart = new ActiveUsersChart();
export const instanceChart = new InstanceChart();
export const perUserNotesChart = new PerUserNotesChart();
export const driveChart = new DriveChart();
export const perUserReactionsChart = new PerUserReactionsChart();
export const hashtagChart = new HashtagChart();
export const perUserFollowingChart = new PerUserFollowingChart();
export const perUserDriveChart = new PerUserDriveChart();
export const apRequestChart = new ApRequestChart();

const charts = [
	federationChart,
	notesChart,
	usersChart,
	activeUsersChart,
	instanceChart,
	perUserNotesChart,
	driveChart,
	perUserReactionsChart,
	hashtagChart,
	perUserFollowingChart,
	perUserDriveChart,
	apRequestChart,
];

// 20分おきにメモリ情報をDBに書き込み
setInterval(() => {
	for (const chart of charts) {
		chart.save();
	}
}, 1000 * 60 * 20);

beforeShutdown(() => Promise.all(charts.map(chart => chart.save())));
