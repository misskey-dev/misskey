/*
 * SPDX-FileCopyrightText: syuilo and misskey-project yojo-art team
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type Logger from '@/logger.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { NotificationService } from '@/core/NotificationService.js';
import { ReversiService } from '@/core/ReversiService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { ApLoggerService } from '../ApLoggerService.js';
import { ApResolverService } from '../ApResolverService.js';
import { UserEntityService } from '../../entities/UserEntityService.js';
import type { IApReversi } from '../type.js';

@Injectable()
export class ApGameService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private apResolverService: ApResolverService,
		private userEntityService: UserEntityService,
		private notificationService: NotificationService,
		private globalEventService: GlobalEventService,
		private apLoggerService: ApLoggerService,
		//ReversiServiceを先に初期化するのでReversiServiceからApGameServiceを利用してはいけない
		private reversiService: ReversiService,
	) {
		this.logger = this.apLoggerService.logger;
	}
	async reversiInboxUpdate(local_user: MiUser, remote_user: MiRemoteUser, apgame: IApReversi) {
		this.logger.debug('リバーシのUpdateが飛んできた' + JSON.stringify(apgame.game_state));
		const id = await this.reversiIdFromUUID(apgame.game_state.game_session_id);
		if (id === null) {
			this.logger.error('Update reversi Id Solve error');
			return;
		}
		if (apgame.game_state.type === 'settings') {
			const key = apgame.game_state.key;
			const value = apgame.game_state.value;
			if (key && value) {
				await this.reversiService.updateSettings(id, remote_user, key, value);
			} else {
				this.logger.warn('skip ApReversi settings unknown key or value');
			}
		} else if (apgame.game_state.type === 'ready_states') {
			const ready = apgame.game_state.ready;
			if (ready !== undefined) {
				await this.reversiService.gameReady(id, remote_user, ready);
			} else {
				this.logger.warn('skip ApReversi undefined ready');
			}
		} else if (apgame.game_state.type === 'putstone') {
			const pos = apgame.game_state.pos;
			if (pos !== undefined) {
				await this.reversiService.putStoneToGame(id, remote_user, pos);
			} else {
				this.logger.warn('skip ApReversi undefined putstone');
			}
		} else {
			this.logger.error('skip ApReversi unknown update type');
		}
	}
	async reversiInboxLeave(local_user: MiUser, remote_user: MiRemoteUser, apgame: IApReversi) {
		const id = await this.reversiIdFromUUID(apgame.game_state.game_session_id);
		if (id === null) {
			this.logger.error('Update reversi Id Solve error');
			return;
		}
		const game = await this.reversiService.get(id);
		if (game === null) return;
		if (game.isStarted) {
			this.reversiService.surrender(id, remote_user);
		} else {
			this.reversiService.cancelGame(id, remote_user);
		}
	}
	async reversiInboxJoin(local_user: MiUser, remote_user: MiRemoteUser, game: IApReversi) {
		const targetUser = local_user;
		const fromUser = remote_user;
		if (!game.game_state.game_session_id) throw Error('bad session' + JSON.stringify(game));
		if (await this.reversiService.federationAvailable(remote_user.host) === false) {
			//確実に利用できない時
			return;
		}
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.zadd(`reversi:matchSpecific:${targetUser.id}`, Date.now(), JSON.stringify( {
			from_user_id: fromUser.id,
			game_session_id: game.game_state.game_session_id,
			host_user_id: local_user.id,
		}));
		redisPipeline.expire(`reversi:matchSpecific:${targetUser.id}`, 120, 'NX');
		await redisPipeline.exec();
	}
	async reversiInboxUndoInvite(actor: MiRemoteUser, target_user:MiLocalUser, game: IApReversi) {
		await this.reversiService.matchSpecificUserCancel(actor, target_user, game.game_state.game_session_id);
	}
	async reversiInboxInvite(local_user: MiUser, remote_user: MiRemoteUser, game: IApReversi) {
		const targetUser = local_user;
		const fromUser = remote_user;
		if (!game.game_state.game_session_id) throw Error('bad session' + JSON.stringify(game));
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.zadd(`reversi:matchSpecific:${targetUser.id}`, Date.now(), JSON.stringify( {
			from_user_id: fromUser.id,
			game_session_id: game.game_state.game_session_id,
			host_user_id: remote_user.id,
		}));
		redisPipeline.expire(`reversi:matchSpecific:${targetUser.id}`, 120, 'NX');
		await redisPipeline.exec();

		this.globalEventService.publishReversiStream(targetUser.id, 'invited', {
			user: await this.userEntityService.pack(fromUser, targetUser),
		});
	}
	public async reversiIdFromUUID(game_session_id:string) :Promise<string|null> {
		//キャッシュにあればそれ
		const cache = await this.redisClient.get(`reversi:federationId:${game_session_id}`);
		if (cache) {
			return cache;
		}
		//無かったらDBから探す
		const game = await this.reversiGamesRepository.findOneBy({ federationId: game_session_id });
		if (game !== null) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.set(`reversi:federationId:${game_session_id}`, game.id);
			redisPipeline.expire(`reversi:federationId:${game_session_id}`, 300);//適当、いい感じにしたい
			await redisPipeline.exec();
			return game.id;
		}
		//DBにも無いなら知らん
		return null;
	}
}
