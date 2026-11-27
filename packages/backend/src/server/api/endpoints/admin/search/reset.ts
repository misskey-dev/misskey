/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '@/core/QueueService.js';
import { ApiError } from '@/server/api/error.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { enqueueSearchIndexMaintenance, searchIndexMaintenanceMeta } from '@/server/api/search-index-maintenance.js';

export const meta = {
	...searchIndexMaintenanceMeta,
	description: 'Queue deletion of all Meilisearch note search documents while preserving notes and index settings.',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		confirm: { type: 'boolean', description: 'Must be true to delete all note search documents.' },
	},
	required: ['confirm'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(queueService: QueueService) {
		super(meta, paramDef, async (ps, me) => {
			if (!ps.confirm) throw new ApiError(meta.errors.INVALID_PARAM, { reason: 'confirm must be true.' });
			return await enqueueSearchIndexMaintenance(queueService, { operation: 'reset' }, me);
		});
	}
}
