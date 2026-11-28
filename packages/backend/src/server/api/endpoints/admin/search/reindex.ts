/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '@/core/QueueService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { enqueueSearchIndexMaintenance, searchIndexMaintenanceMeta } from '@/server/api/search-index-maintenance.js';

export const meta = {
	...searchIndexMaintenanceMeta,
	description: 'Queue indexing of existing notes in Meilisearch without clearing the index.',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceDate: { type: 'integer', nullable: true, description: 'Inclusive start in Unix milliseconds.' },
		untilDate: { type: 'integer', nullable: true, description: 'Exclusive end in Unix milliseconds.' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(queueService: QueueService) {
		super(meta, paramDef, (ps, me) => enqueueSearchIndexMaintenance(queueService, { operation: 'reindex', sinceDate: ps.sinceDate, untilDate: ps.untilDate }, me));
	}
}
