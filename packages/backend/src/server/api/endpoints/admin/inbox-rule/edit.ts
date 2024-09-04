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
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:inbox-rule',

	errors: {
		noSuchRule: {
			message: 'No such rule.',
			code: 'NO_SUCH_RULE',
			id: 'a0e36715-2b4c-4866-a01d-f65d9444a082',
		},
	},

	res: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', nullable: false },
		name: { type: 'string', nullable: true },
		condFormula: { type: 'object', nullable: true },
		action: { type: 'object', nullable: false },
		description: { type: 'string', nullable: false },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.inboxRuleRepository)
		private inboxRuleRepository: InboxRuleRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const rule = await this.inboxRuleRepository.findOneBy({ id: ps.id });
			if (rule == null) {
				throw new ApiError(meta.errors.noSuchRule);
			}
			await this.inboxRuleRepository.update(rule, {
				name: ps.name ?? rule.name,
				condFormula: ps.condFormula ?? rule.condFormula,
				action: ps.action ?? rule.action,
				description: ps.description ?? rule.description,
			});
		});
	}
}
