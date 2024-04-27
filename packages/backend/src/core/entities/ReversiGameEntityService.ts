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
	): Promise<Packed<'ReversiGameDetailed'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		const users = await Promise.all([
			this.userEntityService.pack(game.user1 ?? game.user1Id),
			this.userEntityService.pack(game.user2 ?? game.user2Id),
		]);

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
			user1: users[0],
			user2: users[1],
			winnerId: game.winnerId,
			winner: game.winnerId ? users.find(u => u.id === game.winnerId)! : null,
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
	public packDetailMany(
		xs: MiReversiGame[],
	) {
		return Promise.all(xs.map(x => this.packDetail(x)));
	}

	@bindThis
	public async packLite(
		src: MiReversiGame['id'] | MiReversiGame,
	): Promise<Packed<'ReversiGameLite'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		const users = await Promise.all([
			this.userEntityService.pack(game.user1 ?? game.user1Id),
			this.userEntityService.pack(game.user2 ?? game.user2Id),
		]);

		return await awaitAll({
			id: game.id,
			createdAt: this.idService.parse(game.id).date.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
			endedAt: game.endedAt && game.endedAt.toISOString(),
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1: users[0],
			user2: users[1],
			winnerId: game.winnerId,
			winner: game.winnerId ? users.find(u => u.id === game.winnerId)! : null,
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
	public packLiteMany(
		xs: MiReversiGame[],
	) {
		return Promise.all(xs.map(x => this.packLite(x)));
	}
}

