/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ApiError } from '../../error.js';
import { GetterService } from '../../GetterService.js';

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '0b4f0559-b484-4e31-9581-3f73cee89b28',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private getterService: GetterService,
		private reversiService: ReversiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId) {
				const target = ps.userId ? await this.getterService.getUser(ps.userId).catch(err => {
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
					throw err;
				}) : null;
				if (target == null) {
					throw new ApiError(meta.errors.noSuchUser);
				}
				await this.reversiService.matchSpecificUserCancel(me, target);
				return;
			} else {
				await this.reversiService.matchAnyUserCancel(me);
			}
		});
	}
}
