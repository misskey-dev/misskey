/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { packedReversiGameDetailedSchema } from '@/models/schema/reversi-game.js';
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

		isYourself: {
			message: 'Target user is yourself.',
			code: 'TARGET_IS_YOURSELF',
			id: '96fd7bd6-d2bc-426c-a865-d055dcd2828e',
		},
	},

	res: v.optional(packedReversiGameDetailedSchema),
} as const;

export const paramDef = v.object({
	userId: v.optional(v.nullable(mi.misskeyId())),
	noIrregularRules: v.optional(v.boolean(), false),
	multiple: v.optional(v.boolean(), false),
});

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

			const game = target
				? await this.reversiService.matchSpecificUser(me, target, ps.multiple)
				: await this.reversiService.matchAnyUser(me, { noIrregularRules: ps.noIrregularRules }, ps.multiple);

			if (game == null) return;

			return await this.reversiGameEntityService.packDetail(game);
		});
	}
}
