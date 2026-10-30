/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ReversiService } from '@/core/ReversiService.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const meta = {
	requireCredential: true,

	kind: 'read:account',

	res: v.array(packedUserLiteSchema),
} as const;

export const paramDef = v.object({});

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
