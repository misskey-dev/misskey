/*
 * SPDX-FileCopyrightText: Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InboxRuleRepository, RegistrationTicketsRepository } from '@/models/_.js';
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
		name: { type: 'string', nullable: true },
		condFormula: { type: 'object' },
		action: { type: 'object', nullable: false },
		description: { type: 'string', nullable: false },
	},
	required: ['condFormula', 'action'],
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
			await this.inboxRuleRepository.insert({
				id: this.idService.gen(),
				name: ps.name ?? '無名のルール',
				condFormula: ps.condFormula,
				action: ps.action,
				description: ps.description,
			});
			await this.moderationLogService.log(me, 'setInboxRule', {
				userId: me.id,
				rule: {
					name: ps.name,
					condFormula: ps.condFormula,
					action: ps.action,
					description: ps.description,
				},
			});
		});
	}
}
