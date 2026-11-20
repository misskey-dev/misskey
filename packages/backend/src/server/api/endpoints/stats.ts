/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { InstancesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			notesCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			originalNotesCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			usersCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			originalUsersCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			reactionsCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			instances: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveUsageLocal: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveUsageRemote: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private notesChart: NotesChart,
		private usersChart: UsersChart,
	) {
		super(meta, paramDef, async () => {
			const [notesChart, usersChart, instances] = await Promise.all([
				this.notesChart.getChart('hour', 1, null),
				this.usersChart.getChart('hour', 1, null),
				this.instancesRepository.count(),
			]);

			const notesCount = notesChart.local.total[0] + notesChart.remote.total[0];
			const originalNotesCount = notesChart.local.total[0];

			const usersCount = usersChart.local.total[0] + usersChart.remote.total[0];
			const originalUsersCount = usersChart.local.total[0];

			return {
				notesCount,
				originalNotesCount,
				usersCount,
				originalUsersCount,
				reactionsCount: 0,
				instances,
				driveUsageLocal: 0,
				driveUsageRemote: 0,
			};
		});
	}
}
