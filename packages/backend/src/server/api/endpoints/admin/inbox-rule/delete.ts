/*
 * SPDX-FileCopyrightText: Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InboxRuleRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:inbox-rule',

	errors: {
	},

	res: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', nullable: false },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.inboxRuleRepository)
		private inboxRuleRepository: InboxRuleRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const rule = await this.inboxRuleRepository.findOneBy({ id: ps.id });
			if (!rule) {
				return;
			}
			await this.inboxRuleRepository.delete(rule.id);
			this.moderationLogService.log(me, 'deleteInboxRule', {
				userId: me.id,
				rule: {
					name: rule.name,
					condFormula: rule.condFormula,
					action: rule.action,
				},
			});
		});
	}
}
