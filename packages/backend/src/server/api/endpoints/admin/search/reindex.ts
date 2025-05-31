/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { QueueService } from '@/core/QueueService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	secure: true,
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:search',

	// 1 インスタンス当たり 1 時間に 1 回まで
	limit: {
		duration: ms('1h'),
		max: 1,
	},

	errors: {
		alreadyRunning: {
			message: 'Re-indexing is already running.',
			code: 'ALREADY_RUNNING',
			id: 'a3c6aa4a-56a6-462a-83f9-75d92230dbd3',
			httpStatusCode: 409,
		},
		meilisearchNotActive: {
			message: 'Meilisearch provider is not active.',
			code: 'MEILISEARCH_NOT_ACTIVE',
			id: 'c24a2411-93b4-43aa-a590-6eeda8b178ad',
			httpStatusCode: 400,
		},
	},

	res: {
		type: 'object',
		properties: {
			jobId: { type: 'string' },
		},
		required: ['jobId'],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceDate: { type: 'integer', nullable: true },
		untilDate: { type: 'integer', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueService: QueueService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (this.config.fulltextSearch?.provider !== 'meilisearch') {
				throw new ApiError(meta.errors.meilisearchNotActive);
			}

			// active / waiting / delayed のいずれかに同名 jobId が居れば 409
			const existing = await this.queueService.getReIndexNotesJob();
			if (existing) {
				const state = await existing.getState();
				if (state === 'active' || state === 'waiting' || state === 'delayed' || state === 'waiting-children' || state === 'prioritized') {
					throw new ApiError(meta.errors.alreadyRunning);
				}
				// completed/failed で残っているなら投入前に消す (固定 jobId の再利用)
				await existing.remove();
			}

			const job = await this.queueService.createReIndexNotesJob(me, {
				sinceDate: ps.sinceDate ?? null,
				untilDate: ps.untilDate ?? null,
			});

			await this.moderationLogService.log(me, 'reIndexNotesRequested', {
				sinceDate: ps.sinceDate ?? null,
				untilDate: ps.untilDate ?? null,
			});

			return { jobId: String(job.id) };
		});
	}
}
