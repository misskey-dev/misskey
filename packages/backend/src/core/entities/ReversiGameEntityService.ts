/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
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
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'ReversiGameDetailed'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: game.id,
			createdAt: this.idService.parse(game.id).date.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			form1: game.form1,
			form2: game.form2,
			user1Ready: game.user1Ready,
			user2Ready: game.user2Ready,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1: this.userEntityService.pack(game.user1Id, me),
			user2: this.userEntityService.pack(game.user2Id, me),
			winnerId: game.winnerId,
			winner: game.winnerId ? this.userEntityService.pack(game.winnerId, me) : null,
			surrendered: game.surrendered,
			black: game.black,
			bw: game.bw,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			logs: game.logs.map(log => ({
				at: log.at,
				color: log.color,
				pos: log.pos,
			})),
			map: game.map,
		});
	}

	@bindThis
	public packDetailMany(
		xs: MiReversiGame[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(xs.map(x => this.packDetail(x, me)));
	}

	@bindThis
	public async packLite(
		src: MiReversiGame['id'] | MiReversiGame,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'ReversiGameLite'>> {
		const game = typeof src === 'object' ? src : await this.reversiGamesRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: game.id,
			createdAt: this.idService.parse(game.id).date.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			form1: game.form1,
			form2: game.form2,
			user1Ready: game.user1Ready,
			user2Ready: game.user2Ready,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1: this.userEntityService.pack(game.user1Id, me),
			user2: this.userEntityService.pack(game.user2Id, me),
			winnerId: game.winnerId,
			winner: game.winnerId ? this.userEntityService.pack(game.winnerId, me) : null,
			surrendered: game.surrendered,
			black: game.black,
			bw: game.bw,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
		});
	}

	@bindThis
	public packLiteMany(
		xs: MiReversiGame[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(xs.map(x => this.packLite(x, me)));
	}
}

