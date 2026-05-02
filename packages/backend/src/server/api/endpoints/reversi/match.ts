/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RoleService } from '@/core/RoleService.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { ApiError } from '../../error.js';
import { GetterService } from '../../GetterService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

export const meta = {
	requireCredential: true,
	requireRolePolicy: 'canPlayGames',

	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '0b4f0559-b484-4e31-9581-3f73cee89b28',
		},

		isYourself: {
			message: 'Target user is yourself.',
			code: 'TARGET_IS_YOURSELF',
			id: '96fd7bd6-d2bc-426c-a865-d055dcd2828e',
		},

		isNotAvailable: {
			message: 'You or target user is not available due to server policy.',
			code: 'TARGET_IS_NOT_AVAILABLE',
			id: '3a8a677f-98e5-4c4d-b059-e5874b44bd4f',
		},
	},

	res: {
		type: 'object',
		optional: true,
		ref: 'ReversiGameDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		noIrregularRules: { type: 'boolean', default: false },
		multiple: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private getterService: GetterService,
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId === me.id) throw new ApiError(meta.errors.isYourself);

			const target = ps.userId ? await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			}) : null;

			try {
				const game = target
					? await this.reversiService.matchSpecificUser(me, target, ps.multiple)
					: await this.reversiService.matchAnyUser(me, { noIrregularRules: ps.noIrregularRules }, ps.multiple);

				if (game == null) return;

				return await this.reversiGameEntityService.packDetail(game);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					switch (err.id) {
						case 'eeb95261-6538-4294-a1d1-ed9a40d2c25b':
							throw new ApiError(meta.errors.isYourself);
						case '6a8a09eb-f359-4339-9b1d-2fb3f8c0df45':
							throw new ApiError(meta.errors.isNotAvailable);
						default:
							throw err;
					}
				} else {
					throw err;
				}
			}
		});
	}
}
