/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { ValidatableSchema } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ReversiService } from '@/core/ReversiService.js';

export const meta = {
	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: { ref: 'UserLite' },
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
} as const satisfies ValidatableSchema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private reversiService: ReversiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const invitations = await this.reversiService.getInvitations(me);

			return await this.userEntityService.packMany(invitations, me);
		});
	}
}
