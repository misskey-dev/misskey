import { entity as FederationChart } from './charts/entities/federation.js';
import { entity as NotesChart } from './charts/entities/notes.js';
import { entity as UsersChart } from './charts/entities/users.js';
import { entity as ActiveUsersChart } from './charts/entities/active-users.js';
import { entity as InstanceChart } from './charts/entities/instance.js';
import { entity as PerUserNotesChart } from './charts/entities/per-user-notes.js';
import { entity as DriveChart } from './charts/entities/drive.js';
import { entity as PerUserReactionsChart } from './charts/entities/per-user-reactions.js';
import { entity as HashtagChart } from './charts/entities/hashtag.js';
import { entity as PerUserFollowingChart } from './charts/entities/per-user-following.js';
import { entity as PerUserDriveChart } from './charts/entities/per-user-drive.js';
import { entity as ApRequestChart } from './charts/entities/ap-request.js';

export const entities = [
	FederationChart.hour, FederationChart.day,
	NotesChart.hour, NotesChart.day,
	UsersChart.hour, UsersChart.day,
	ActiveUsersChart.hour, ActiveUsersChart.day,
	InstanceChart.hour, InstanceChart.day,
	PerUserNotesChart.hour, PerUserNotesChart.day,
	DriveChart.hour, DriveChart.day,
	PerUserReactionsChart.hour, PerUserReactionsChart.day,
	HashtagChart.hour, HashtagChart.day,
	PerUserFollowingChart.hour, PerUserFollowingChart.day,
	PerUserDriveChart.hour, PerUserDriveChart.day,
	ApRequestChart.hour, ApRequestChart.day,
];
