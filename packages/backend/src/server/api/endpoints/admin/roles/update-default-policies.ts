/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MetaService } from '@/core/MetaService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		policies: {
			type: 'object',
		},
	},
	required: [
		'policies',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const before = await this.metaService.fetch(true);

			await this.metaService.update({
				policies: ps.policies,
			});

			const after = await this.metaService.fetch(true);

			this.globalEventService.publishInternalEvent('policiesUpdated', after.policies);
			this.moderationLogService.log(me, 'updateServerSettings', {
				before: before.policies,
				after: after.policies,
			});
		});
	}
}
