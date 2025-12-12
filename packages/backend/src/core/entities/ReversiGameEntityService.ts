/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiReversiGame } from '@/models/ReversiGame.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ReversiGameEntityService {
	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async packDetail(
		src: MiReversiGame['id'] | MiReversiGame,
		hint?: {
			packedUser1?: Packed<'UserLite'>,
			packedUser2?: Packed<'UserLite'>,
		},
	): Promise<Packed<'ReversiGameDetailed'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		const user1 = hint?.packedUser1 ?? await this.userEntityService.pack(game.user1 ?? game.user1Id);
		const user2 = hint?.packedUser2 ?? await this.userEntityService.pack(game.user2 ?? game.user2Id);

		return await awaitAll({
			id: game.id,
			createdAt: this.idService.parse(game.id).date.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
			endedAt: game.endedAt && game.endedAt.toISOString(),
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			form1: game.form1,
			form2: game.form2,
			user1Ready: game.user1Ready,
			user2Ready: game.user2Ready,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1,
			user2,
			winnerId: game.winnerId,
			winner: game.winnerId ? [user1, user2].find(u => u.id === game.winnerId)! : null,
			surrenderedUserId: game.surrenderedUserId,
			timeoutUserId: game.timeoutUserId,
			black: game.black,
			bw: game.bw,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			timeLimitForEachTurn: game.timeLimitForEachTurn,
			noIrregularRules: game.noIrregularRules,
			logs: game.logs,
			map: game.map,
		});
	}

	@bindThis
	public async packDetailMany(
		games: MiReversiGame[],
	) {
		const _user1s = games.map(({ user1, user1Id }) => user1 ?? user1Id);
		const _user2s = games.map(({ user2, user2Id }) => user2 ?? user2Id);
		const _userMap = await this.userEntityService.packMany([..._user1s, ..._user2s])
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			games.map(game => {
				return this.packDetail(game, {
					packedUser1: _userMap.get(game.user1Id),
					packedUser2: _userMap.get(game.user2Id),
				});
			}),
		);
	}

	@bindThis
	public async packLite(
		src: MiReversiGame['id'] | MiReversiGame,
		hint?: {
			packedUser1?: Packed<'UserLite'>,
			packedUser2?: Packed<'UserLite'>,
		},
	): Promise<Packed<'ReversiGameLite'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		const user1 = hint?.packedUser1 ?? await this.userEntityService.pack(game.user1 ?? game.user1Id);
		const user2 = hint?.packedUser2 ?? await this.userEntityService.pack(game.user2 ?? game.user2Id);

		return await awaitAll({
			id: game.id,
			createdAt: this.idService.parse(game.id).date.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
			endedAt: game.endedAt && game.endedAt.toISOString(),
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1,
			user2,
			winnerId: game.winnerId,
			winner: game.winnerId ? [user1, user2].find(u => u.id === game.winnerId)! : null,
			surrenderedUserId: game.surrenderedUserId,
			timeoutUserId: game.timeoutUserId,
			black: game.black,
			bw: game.bw,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			timeLimitForEachTurn: game.timeLimitForEachTurn,
			noIrregularRules: game.noIrregularRules,
		});
	}

	@bindThis
	public async packLiteMany(
		games: MiReversiGame[],
	) {
		const _user1s = games.map(({ user1, user1Id }) => user1 ?? user1Id);
		const _user2s = games.map(({ user2, user2Id }) => user2 ?? user2Id);
		const _userMap = await this.userEntityService.packMany([..._user1s, ..._user2s])
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			games.map(game => {
				return this.packLite(game, {
					packedUser1: _userMap.get(game.user1Id),
					packedUser2: _userMap.get(game.user2Id),
				});
			}),
		);
	}
}

