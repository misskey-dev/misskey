/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import {
	descriptionSchema,
} from '@/models/User.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:account',

	res: {
		type: 'object',
		nullable: false, optional: false,
		ref: 'UserDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		description: { ...descriptionSchema, nullable: true },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const proxy = await this.systemAccountService.updateCorrespondingUserProfile('proxy', {
				description: ps.description,
			});

			const updated = await this.userEntityService.pack(proxy.id, proxy, {
				schema: 'MeDetailed',
			});

			if (ps.description !== undefined) {
				this.moderationLogService.log(me, 'updateProxyAccountDescription', {
					before: null, //TODO
					after: ps.description,
				});
			}

			return updated;
		});
	}
}
