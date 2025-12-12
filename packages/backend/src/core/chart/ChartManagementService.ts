/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OnApplicationShutdown } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type ActiveUsersChart from './charts/active-users.js';
import type ApRequestChart from './charts/ap-request.js';
import type DriveChart from './charts/drive.js';
import type FederationChart from './charts/federation.js';
import type InstanceChart from './charts/instance.js';
import type NotesChart from './charts/notes.js';
import type PerUserDriveChart from './charts/per-user-drive.js';
import type PerUserFollowingChart from './charts/per-user-following.js';
import type PerUserNotesChart from './charts/per-user-notes.js';
import type PerUserPvChart from './charts/per-user-pv.js';
import type PerUserReactionsChart from './charts/per-user-reactions.js';
import type UsersChart from './charts/users.js';

@Injectable()
export class ChartManagementService implements OnApplicationShutdown {
	private charts;
	private saveIntervalId: NodeJS.Timeout;

	constructor(
		private federationChart: FederationChart,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private perUserNotesChart: PerUserNotesChart,
		private perUserPvChart: PerUserPvChart,
		private driveChart: DriveChart,
		private perUserReactionsChart: PerUserReactionsChart,
		private perUserFollowingChart: PerUserFollowingChart,
		private perUserDriveChart: PerUserDriveChart,
		private apRequestChart: ApRequestChart,
	) {
		this.charts = [
			this.federationChart,
			this.notesChart,
			this.usersChart,
			this.activeUsersChart,
			this.instanceChart,
			this.perUserNotesChart,
			this.perUserPvChart,
			this.driveChart,
			this.perUserReactionsChart,
			this.perUserFollowingChart,
			this.perUserDriveChart,
			this.apRequestChart,
		];
	}

	@bindThis
	public async start() {
		// 20分おきにメモリ情報をDBに書き込み
		this.saveIntervalId = setInterval(async () => {
			for (const chart of this.charts) {
				await chart.save();
			}
		}, 1000 * 60 * 20);
	}

	@bindThis
	public async dispose(): Promise<void> {
		clearInterval(this.saveIntervalId);
		if (process.env.NODE_ENV !== 'test') {
			for (const chart of this.charts) {
				await chart.save();
			}
		}
	}

	@bindThis
	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
