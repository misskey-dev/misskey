/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SearchIndexMaintenanceError } from '@/queue/SearchIndexMaintenanceQueue.js';
import type { QueueService } from '@/core/QueueService.js';
import type { MiLocalUser } from '@/models/User.js';
import type { SearchIndexMaintenanceRequest } from '@/queue/types.js';
import { ApiError } from './error.js';

export const searchIndexMaintenanceMeta = {
	tags: ['admin'],
	secure: true,
	requireCredential: true,
	requireAdmin: true,

	errors: {
		ALREADY_RUNNING: {
			message: 'A Meilisearch maintenance job is already queued or running.',
			code: 'ALREADY_RUNNING',
			id: 'a3c6aa4a-56a6-462a-83f9-75d92230dbd3',
			httpStatusCode: 409,
		},
		SEARCH_INDEX_RECOVERY_REQUIRED: {
			message: 'A previous Meilisearch write could not be verified. See docs/meilisearch-maintenance.md before retrying.',
			code: 'SEARCH_INDEX_RECOVERY_REQUIRED',
			id: '4f45a74f-de15-4756-8b30-a116d4262708',
			httpStatusCode: 409,
		},
		MEILISEARCH_NOT_ACTIVE: {
			message: 'Meilisearch provider is not active.',
			code: 'MEILISEARCH_NOT_ACTIVE',
			id: 'c24a2411-93b4-43aa-a590-6eeda8b178ad',
			httpStatusCode: 400,
		},
		INVALID_PARAM: {
			message: 'Invalid param.',
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			jobId: { type: 'string', optional: false, nullable: false },
		},
		required: ['jobId'],
	},
} as const;

export async function enqueueSearchIndexMaintenance(queueService: QueueService, request: SearchIndexMaintenanceRequest, me: MiLocalUser) {
	try {
		return await queueService.enqueueSearchIndexMaintenance(request, me);
	} catch (err) {
		if (err instanceof SearchIndexMaintenanceError) {
			throw new ApiError(searchIndexMaintenanceMeta.errors[err.code], { reason: err.message, jobId: err.jobId });
		}
		throw err;
	}
}
