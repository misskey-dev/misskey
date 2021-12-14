import { entity as FederationChart } from './charts/entities/federation';
import { entity as NotesChart } from './charts/entities/notes';
import { entity as UsersChart } from './charts/entities/users';
import { entity as NetworkChart } from './charts/entities/network';
import { entity as ActiveUsersChart } from './charts/entities/active-users';
import { entity as InstanceChart } from './charts/entities/instance';
import { entity as PerUserNotesChart } from './charts/entities/per-user-notes';
import { entity as DriveChart } from './charts/entities/drive';
import { entity as PerUserReactionsChart } from './charts/entities/per-user-reactions';
import { entity as HashtagChart } from './charts/entities/hashtag';
import { entity as PerUserFollowingChart } from './charts/entities/per-user-following';
import { entity as PerUserDriveChart } from './charts/entities/per-user-drive';

export const entities = [
	FederationChart.hour, FederationChart.day,
	NotesChart.hour, NotesChart.day,
	UsersChart.hour, UsersChart.day,
	NetworkChart.hour, NetworkChart.day,
	ActiveUsersChart.hour, ActiveUsersChart.day,
	InstanceChart.hour, InstanceChart.day,
	PerUserNotesChart.hour, PerUserNotesChart.day,
	DriveChart.hour, DriveChart.day,
	PerUserReactionsChart.hour, PerUserReactionsChart.day,
	HashtagChart.hour, HashtagChart.day,
	PerUserFollowingChart.hour, PerUserFollowingChart.day,
	PerUserDriveChart.hour, PerUserDriveChart.day,
];
