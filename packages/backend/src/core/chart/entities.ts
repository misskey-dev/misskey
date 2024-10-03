/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entity as FederationChart } from './charts/entities/federation.js';
import { entity as NotesChart } from './charts/entities/notes.js';
import { entity as UsersChart } from './charts/entities/users.js';
import { entity as ActiveUsersChart } from './charts/entities/active-users.js';
import { entity as InstanceChart } from './charts/entities/instance.js';
import { entity as PerUserNotesChart } from './charts/entities/per-user-notes.js';
import { entity as PerUserPvChart } from './charts/entities/per-user-pv.js';
import { entity as DriveChart } from './charts/entities/drive.js';
import { entity as PerUserReactionsChart } from './charts/entities/per-user-reactions.js';
import { entity as PerUserFollowingChart } from './charts/entities/per-user-following.js';
import { entity as PerUserDriveChart } from './charts/entities/per-user-drive.js';
import { entity as ApRequestChart } from './charts/entities/ap-request.js';

import { entity as TestChart } from './charts/entities/test.js';
import { entity as TestGroupedChart } from './charts/entities/test-grouped.js';
import { entity as TestUniqueChart } from './charts/entities/test-unique.js';
import { entity as TestIntersectionChart } from './charts/entities/test-intersection.js';

export const entities = [
	FederationChart.hour, FederationChart.day,
	NotesChart.hour, NotesChart.day,
	UsersChart.hour, UsersChart.day,
	ActiveUsersChart.hour, ActiveUsersChart.day,
	InstanceChart.hour, InstanceChart.day,
	PerUserNotesChart.hour, PerUserNotesChart.day,
	PerUserPvChart.hour, PerUserPvChart.day,
	DriveChart.hour, DriveChart.day,
	PerUserReactionsChart.hour, PerUserReactionsChart.day,
	PerUserFollowingChart.hour, PerUserFollowingChart.day,
	PerUserDriveChart.hour, PerUserDriveChart.day,
	ApRequestChart.hour, ApRequestChart.day,

	...(process.env.NODE_ENV === 'test' ? [
		TestChart.hour, TestChart.day,
		TestGroupedChart.hour, TestGroupedChart.day,
		TestUniqueChart.hour, TestUniqueChart.day,
		TestIntersectionChart.hour, TestIntersectionChart.day,
	] : []),
];
