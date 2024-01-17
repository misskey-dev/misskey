/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { ReversiGamesRepository, ReversiMatchingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
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

	res: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		@Inject(DI.reversiMatchingsRepository)
		private reversiMatchingsRepository: ReversiMatchingsRepository,

		private getterService: GetterService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId === me.id) {
				throw new ApiError(meta.errors.isYourself);
			}

			const exist = await this.reversiMatchingsRepository.findOneBy({
				parentId: ps.userId,
				childId: me.id,
			});

			if (exist) {
				this.reversiMatchingsRepository.delete(exist.id);

				const game = await this.reversiGamesRepository.insert({
					id: this.idService.gen(),
					user1Id: exist.parentId,
					user2Id: me.id,
					user1Accepted: false,
					user2Accepted: false,
					isStarted: false,
					isEnded: false,
					logs: [],
					map: eighteight.data,
					bw: 'random',
					isLlotheo: false,
				});

				publishReversiStream(exist.parentId, 'matched', await ReversiGames.pack(game, { id: exist.parentId }));

				const other = await this.reversiMatchingsRepository.countBy({
					childId: me.id,
				});

				if (other == 0) {
					publishMainStream(me.id, 'reversiNoInvites');
				}

				return await ReversiGames.pack(game, me);
			} else {
				const child = await this.getterService.getUser(ps.userId).catch(err => {
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
					throw err;
				});

				await this.reversiMatchingsRepository.delete({
					parentId: me.id,
				});

				const matching = await this.reversiMatchingsRepository.insert({
					id: this.idService.gen(),
					parentId: me.id,
					childId: child.id,
				});

				const packed = await ReversiMatchings.pack(matching, child);
				publishReversiStream(child.id, 'invited', packed);
				publishMainStream(child.id, 'reversiInvited', packed);

				return;
			}
		});
	}
}
