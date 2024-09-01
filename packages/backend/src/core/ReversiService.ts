/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ModuleRef } from '@nestjs/core';
import { reversiUpdateKeys } from 'misskey-js';
import * as Reversi from 'misskey-reversi';
import { LessThan, MoreThan } from 'typeorm';
import type {
	MiReversiGame,
	ReversiGamesRepository,
} from '@/models/_.js';
import type { MiRemoteUser, MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { Serialized } from '@/types.js';
import { trackPromise } from '@/misc/promise-tracker.js';
import type Logger from '@/logger.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { ReversiGameEntityService } from './entities/ReversiGameEntityService.js';
import { ApRendererService } from './activitypub/ApRendererService.js';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';
import { LoggerService } from './LoggerService.js';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

const INVITATION_TIMEOUT_MS = 1000 * 20; // 20sec

@Injectable()
export class ReversiService implements OnApplicationShutdown, OnModuleInit {
	private notificationService: NotificationService;
	private logger: Logger;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private reversiGameEntityService: ReversiGameEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private loggerService: LoggerService,
		private idService: IdService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
	) {
		this.logger = this.loggerService.getLogger('reversi');
	}

	async onModuleInit() {
		this.notificationService = this.moduleRef.get(NotificationService.name);
	}

	@bindThis
	private async cacheGame(game: MiReversiGame) {
		await this.redisClient.setex(`reversi:game:cache:${game.id}`, 60 * 60, JSON.stringify(game));
	}

	@bindThis
	private async deleteGameCache(gameId: MiReversiGame['id']) {
		await this.redisClient.del(`reversi:game:cache:${gameId}`);
	}

	@bindThis
	private getBakeProps(game: MiReversiGame) {
		return {
			startedAt: game.startedAt,
			endedAt: game.endedAt,
			// ゲームの途中からユーザーが変わることは無いので
			//user1Id: game.user1Id,
			//user2Id: game.user2Id,
			user1Ready: game.user1Ready,
			user2Ready: game.user2Ready,
			black: game.black,
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			winnerId: game.winnerId,
			surrenderedUserId: game.surrenderedUserId,
			timeoutUserId: game.timeoutUserId,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			timeLimitForEachTurn: game.timeLimitForEachTurn,
			logs: game.logs,
			map: game.map,
			bw: game.bw,
			crc32: game.crc32,
			noIrregularRules: game.noIrregularRules,
		} satisfies Partial<MiReversiGame>;
	}

	@bindThis
	public async remoteVersion(host:string): Promise<string | null> {
		const cache = await this.redisClient.get(`reversi:federation:version:${host}`);
		if (cache !== null) {
			return cache.length === 0 ? null : cache;
		}
		const instance = await this.federatedInstanceService.fetch(host);
		const nodeinfo = await this.fetchInstanceMetadataService.fetchNodeinfo(instance);
		const reversiVersion = nodeinfo.metadata?.reversiVersion;
		if (typeof(reversiVersion) === 'string') {
			//0.0.0-foo => 0.0.0
			const version = reversiVersion.split('-')[0];
			await this.redisClient.setex(`reversi:federation:version:${host}`, 5 * 60, version);
			return version;
		}
		await this.redisClient.setex(`reversi:federation:version:${host}`, 5 * 60, '');
		return null;
	}
	@bindThis
	public async federationAvailable(host:string): Promise<boolean | null> {
		const version = await this.remoteVersion(host);
		if (version === null) {
			//初期の実装はバージョンを返さない
			return null;
		}
		const versionElements = version.split('.');
		if (versionElements.length === 3) {
			if (versionElements[0] !== NodeinfoServerService.reversiVersion.split('.')[0]) {
				//メジャーバージョン不一致
				return false;
			}
		}
		return true;
	}

	@bindThis
	public async matchSpecificUser(me: MiUser, targetUser: MiUser, multiple = false, accept_only = false): Promise<MiReversiGame | null> {
		if (targetUser.id === me.id) {
			throw new Error('You cannot match yourself.');
		}

		if (!multiple) {
			// 既にマッチしている対局が無いか探す(3分以内)
			const games = await this.reversiGamesRepository.find({
				where: [
					{ id: MoreThan(this.idService.gen(Date.now() - 1000 * 60 * 3)), user1Id: me.id, user2Id: targetUser.id, isStarted: false },
					{ id: MoreThan(this.idService.gen(Date.now() - 1000 * 60 * 3)), user1Id: targetUser.id, user2Id: me.id, isStarted: false },
				],
				relations: ['user1', 'user2'],
				order: { id: 'DESC' },
			});
			if (games.length > 0) {
				return games[0];
			}
		}

		//#region 相手から既に招待されてないか確認
		const invitations = (await this.redisClient.zrange(
			`reversi:matchSpecific:${me.id}`,
			Date.now() - INVITATION_TIMEOUT_MS,
			'+inf',
			'BYSCORE')).map(raw => JSON.parse(raw));

		for (const invite of invitations) {
			if (invite.from_user_id === targetUser.id) {
				const game_session_id:string|undefined = invite.game_session_id;
				this.logger.info('ゲーム開始 共通セッションid=' + game_session_id);
				await this.redisClient.zrem(`reversi:matchSpecific:${me.id}`, JSON.stringify(invite));

				const parentId = invite.host_user_id ? invite.host_user_id : targetUser.id;
				const childId = parentId === me.id ? targetUser.id : me.id;
				const game = await this.matched(parentId, childId, {
					noIrregularRules: false,
				}, game_session_id);
				if (targetUser.host !== null && game_session_id) {
					//重要。リモートユーザーが送ってきたIDの解決に使う
					const redisPipeline = this.redisClient.pipeline();
					redisPipeline.set(`reversi:federationId:${game_session_id}`, game.id);
					redisPipeline.expire(`reversi:federationId:${game_session_id}`, 300);//適当、いい感じにしたい
					await redisPipeline.exec();
					//リモートユーザーに参加を飛ばす
					if (targetUser.uri === null) {
						throw new Error('WIP');
					}
					const join = await this.apRendererService.renderReversiJoin(game_session_id, me, targetUser as MiRemoteUser, new Date());
					const content = this.apRendererService.addContext(join);
					const dm = this.apDeliverManagerService.createDeliverManager({
						id: me.id,
						host: null,
					}, content);
					dm.addDirectRecipe(targetUser as MiRemoteUser);
					trackPromise(dm.execute());
				}

				return game;
			}
		}
		//#endregion
		//参加のみフラグが付いていた場合は招待を確認するだけ
		if (accept_only) {
			return null;
		}
		if (targetUser.host !== null) {
			//リモートユーザーに招待を飛ばす
			if (targetUser.uri === null) {
				throw new Error('WIP');
			}
			const remote_user : MiRemoteUser = targetUser as MiRemoteUser;
			const game_session_id = randomUUID().toString();
			const invite = await this.apRendererService.renderReversiInvite(game_session_id, me, remote_user, new Date());
			const content = this.apRendererService.addContext(invite);

			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.zadd(`reversi:matchSpecific:${targetUser.id}`, Date.now(), JSON.stringify(invite));
			redisPipeline.expire(`reversi:matchSpecific:${targetUser.id}`, 120, 'NX', () => {
				const undo = this.apRendererService.renderUndo(invite, me);
				const content = this.apRendererService.addContext(undo);
				const dm = this.apDeliverManagerService.createDeliverManager({
					id: me.id,
					host: null,
				}, content);
				dm.addDirectRecipe(targetUser as MiRemoteUser);
				trackPromise(dm.execute());
			});
			await redisPipeline.exec();
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: me.id,
				host: null,
			}, content);
			dm.addDirectRecipe(targetUser as MiRemoteUser);
			trackPromise(dm.execute());
		} else {
			//ローカルユーザーの待機リストに追加する
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.zadd(`reversi:matchSpecific:${targetUser.id}`, Date.now(), JSON.stringify({
				from_user_id: me.id,
			}));
			redisPipeline.expire(`reversi:matchSpecific:${targetUser.id}`, 120, 'NX');
			await redisPipeline.exec();

			this.globalEventService.publishReversiStream(targetUser.id, 'invited', {
				user: await this.userEntityService.pack(me, targetUser),
			});
		}
		return null;
	}
	@bindThis
	public async matchAnyUser(me: MiUser, options: { noIrregularRules: boolean }, multiple = false): Promise<MiReversiGame | null> {
		if (!multiple) {
			// 既にマッチしている対局が無いか探す(3分以内)
			const games = await this.reversiGamesRepository.find({
				where: [
					{ id: MoreThan(this.idService.gen(Date.now() - 1000 * 60 * 3)), user1Id: me.id, isStarted: false },
					{ id: MoreThan(this.idService.gen(Date.now() - 1000 * 60 * 3)), user2Id: me.id, isStarted: false },
				],
				relations: ['user1', 'user2'],
				order: { id: 'DESC' },
			});
			if (games.length > 0) {
				return games[0];
			}
		}

		//#region まず自分宛ての招待を探す
		const invitations = await this.redisClient.zrange(
			`reversi:matchSpecific:${me.id}`,
			Date.now() - INVITATION_TIMEOUT_MS,
			'+inf',
			'BYSCORE');

		if (invitations.length > 0) {
			const invitorId = invitations[Math.floor(Math.random() * invitations.length)];
			await this.redisClient.zrem(`reversi:matchSpecific:${me.id}`, invitorId);

			const game = await this.matched(invitorId, me.id, {
				noIrregularRules: false,
			});

			return game;
		}
		//#endregion

		const matchings = await this.redisClient.zrange(
			'reversi:matchAny',
			0,
			2, // 自分自身のIDが入っている場合もあるので2つ取得
			'REV');

		const items = matchings.filter(id => !id.startsWith(me.id));

		if (items.length > 0) {
			const [matchedUserId, option] = items[0].split(':');

			await this.redisClient.zrem('reversi:matchAny',
				me.id,
				matchedUserId,
				me.id + ':noIrregularRules',
				matchedUserId + ':noIrregularRules');

			const game = await this.matched(matchedUserId, me.id, {
				noIrregularRules: options.noIrregularRules || option === 'noIrregularRules',
			});

			return game;
		} else {
			const redisPipeline = this.redisClient.pipeline();
			if (options.noIrregularRules) {
				redisPipeline.zadd('reversi:matchAny', Date.now(), me.id + ':noIrregularRules');
			} else {
				redisPipeline.zadd('reversi:matchAny', Date.now(), me.id);
			}
			redisPipeline.expire('reversi:matchAny', 15, 'NX');
			await redisPipeline.exec();
			return null;
		}
	}

	@bindThis
	public async matchSpecificUserCancel(user: MiUser, targetUser: MiUser, game_session_id:string|undefined = undefined) {
		await this.redisClient.zrem(`reversi:matchSpecific:${targetUser.id}`, JSON.stringify({
			from_user_id: user.id,
			game_session_id,
		}));
	}

	@bindThis
	public async matchAnyUserCancel(user: MiUser) {
		await this.redisClient.zrem('reversi:matchAny', user.id, user.id + ':noIrregularRules');
	}

	@bindThis
	public async cleanOutdatedGames() {
		await this.reversiGamesRepository.delete({
			id: LessThan(this.idService.gen(Date.now() - 1000 * 60 * 10)),
			isStarted: false,
		});
	}

	@bindThis
	public async gameReady(gameId: MiReversiGame['id'], user: MiUser, ready: boolean) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (game.isStarted) return;

		let isBothReady = false;

		if (game.user1Id === user.id) {
			const updatedGame = {
				...game,
				user1Ready: ready,
			};
			this.cacheGame(updatedGame);

			this.globalEventService.publishReversiGameStream(game.id, 'changeReadyStates', {
				user1: ready,
				user2: updatedGame.user2Ready,
			});

			if (ready && updatedGame.user2Ready) isBothReady = true;
		} else if (game.user2Id === user.id) {
			const updatedGame = {
				...game,
				user2Ready: ready,
			};
			this.cacheGame(updatedGame);

			this.globalEventService.publishReversiGameStream(game.id, 'changeReadyStates', {
				user1: updatedGame.user1Ready,
				user2: ready,
			});

			if (ready && updatedGame.user1Ready) isBothReady = true;
		} else {
			return;
		}
		const remote_user = user.id === game.user1Id ? game.user2 : game.user1;
		if (user.host === null && remote_user && remote_user.host) {
			if (game.federationId === null) throw new Error('game.federationId===null');
			const update = await this.apRendererService.renderReversiUpdate(user, remote_user as MiRemoteUser, {
				game_session_id: game.federationId,
				type: 'ready_states',
				ready,
			});
			const content = this.apRendererService.addContext(update);
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: user.id,
				host: null,
			}, content);
			dm.addDirectRecipe(remote_user as MiRemoteUser);
			trackPromise(dm.execute());
		}

		if (isBothReady) {
			// 3秒後、両者readyならゲーム開始
			setTimeout(async () => {
				const freshGame = await this.get(game.id);
				if (freshGame == null || freshGame.isStarted || freshGame.isEnded) return;
				if (!freshGame.user1Ready || !freshGame.user2Ready) return;

				this.startGame(freshGame);
			}, 3000);
		}
	}

	@bindThis
	private async matched(parentId: MiUser['id'], childId: MiUser['id'], options: { noIrregularRules: boolean;}, federationId:string|null = null): Promise<MiReversiGame> {
		const game = await this.reversiGamesRepository.insertOne({
			id: this.idService.gen(),
			user1Id: parentId,
			user2Id: childId,
			user1Ready: false,
			user2Ready: false,
			isStarted: false,
			isEnded: false,
			logs: [],
			map: Reversi.maps.eighteight.data,
			bw: 'random',
			isLlotheo: false,
			noIrregularRules: options.noIrregularRules,
			federationId,
		}, { relations: ['user1', 'user2'] });
		this.cacheGame(game);

		const packed = await this.reversiGameEntityService.packDetail(game);
		this.globalEventService.publishReversiStream(parentId, 'matched', { game: packed });

		return game;
	}

	@bindThis
	private async startGame(game: MiReversiGame) {
		let bw: number;
		if (game.bw === 'random') {
			//連合プレイの場合完全ランダムにすると同期が大変なので連合管理用のidから生成する
			if (game.federationId) {
				//境界外アクセスするとundefinedになる
				const cp = game.federationId.codePointAt(0);
				bw = cp ? (cp % 2 === 0 ? 1 : 2) : 1;
			} else {
				bw = Math.random() > 0.5 ? 1 : 2;
			}
		} else {
			bw = parseInt(game.bw, 10);
		}

		const engine = new Reversi.Game(game.map, {
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
		});

		const crc32 = engine.calcCrc32().toString();

		const updatedGame = await this.reversiGamesRepository.createQueryBuilder().update()
			.set({
				...this.getBakeProps(game),
				startedAt: new Date(),
				isStarted: true,
				black: bw,
				map: game.map,
				crc32,
			})
			.where('id = :id', { id: game.id })
			.returning('*')
			.execute()
			.then((response) => response.raw[0]);
		// キャッシュ効率化のためにユーザー情報は再利用
		updatedGame.user1 = game.user1;
		updatedGame.user2 = game.user2;
		this.cacheGame(updatedGame);

		//#region 盤面に最初から石がないなどして始まった瞬間に勝敗が決定する場合があるのでその処理
		if (engine.isEnded) {
			let winnerId;
			if (engine.winner === true) {
				winnerId = bw === 1 ? updatedGame.user1Id : updatedGame.user2Id;
			} else if (engine.winner === false) {
				winnerId = bw === 1 ? updatedGame.user2Id : updatedGame.user1Id;
			} else {
				winnerId = null;
			}

			await this.endGame(updatedGame, winnerId, null);

			return;
		}
		//#endregion

		this.redisClient.setex(`reversi:game:turnTimer:${game.id}:1`, updatedGame.timeLimitForEachTurn, '');

		this.globalEventService.publishReversiGameStream(game.id, 'started', {
			game: await this.reversiGameEntityService.packDetail(updatedGame),
		});
	}

	@bindThis
	private async endGame(game: MiReversiGame, winnerId: MiUser['id'] | null, reason: 'surrender' | 'timeout' | null) {
		const updatedGame = await this.reversiGamesRepository.createQueryBuilder().update()
			.set({
				...this.getBakeProps(game),
				isEnded: true,
				endedAt: new Date(),
				winnerId: winnerId,
				surrenderedUserId: reason === 'surrender' ? (winnerId === game.user1Id ? game.user2Id : game.user1Id) : null,
				timeoutUserId: reason === 'timeout' ? (winnerId === game.user1Id ? game.user2Id : game.user1Id) : null,
			})
			.where('id = :id', { id: game.id })
			.returning('*')
			.execute()
			.then((response) => response.raw[0]);
		// キャッシュ効率化のためにユーザー情報は再利用
		updatedGame.user1 = game.user1;
		updatedGame.user2 = game.user2;
		this.cacheGame(updatedGame);

		this.globalEventService.publishReversiGameStream(game.id, 'ended', {
			winnerId: winnerId,
			game: await this.reversiGameEntityService.packDetail(updatedGame),
		});
	}

	@bindThis
	public async getInvitations(user: MiUser): Promise<MiUser['id'][]> {
		const invitations = await this.redisClient.zrange(
			`reversi:matchSpecific:${user.id}`,
			Date.now() - INVITATION_TIMEOUT_MS,
			'+inf',
			'BYSCORE');
		return invitations;
	}

	@bindThis
	public isValidReversiUpdateKey(key: unknown): key is typeof reversiUpdateKeys[number] {
		if (typeof key !== 'string') return false;
		return (reversiUpdateKeys as string[]).includes(key);
	}

	@bindThis
	public isValidReversiUpdateValue<K extends typeof reversiUpdateKeys[number]>(key: K, value: unknown): value is MiReversiGame[K] {
		switch (key) {
			case 'map':
				return Array.isArray(value) && value.every(row => typeof row === 'string');
			case 'bw':
				return typeof value === 'string' && ['random', '1', '2'].includes(value);
			case 'isLlotheo':
				return typeof value === 'boolean';
			case 'canPutEverywhere':
				return typeof value === 'boolean';
			case 'loopedBoard':
				return typeof value === 'boolean';
			case 'timeLimitForEachTurn':
				return typeof value === 'number' && value >= 0;
			default:
				return false;
		}
	}

	@bindThis
	public async updateSettings<K extends typeof reversiUpdateKeys[number]>(gameId: MiReversiGame['id'], user: MiUser, key: K, value: MiReversiGame[K]) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (game.isStarted) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;
		if ((game.user1Id === user.id) && game.user1Ready) return;
		if ((game.user2Id === user.id) && game.user2Ready) return;

		const updatedGame = {
			...game,
			[key]: value,
		};
		this.cacheGame(updatedGame);

		this.globalEventService.publishReversiGameStream(game.id, 'updateSettings', {
			userId: user.id,
			key: key,
			value: value,
		});

		const remote_user = user.id === game.user1Id ? game.user2 : game.user1;

		if (user.host === null && remote_user && remote_user.host !== null) {
			if (game.federationId === null) throw new Error('game.federationId===null');
			const update = await this.apRendererService.renderReversiUpdate(user, remote_user as MiRemoteUser, {
				game_session_id: game.federationId,
				type: 'settings',
				key,
				value,
			});
			const content = this.apRendererService.addContext(update);
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: user.id,
				host: null,
			}, content);
			dm.addDirectRecipe(remote_user as MiRemoteUser);
			trackPromise(dm.execute());
		}
	}

	@bindThis
	public async putStoneToGame(gameId: MiReversiGame['id'], user: MiUser, pos: number, id?: string | null) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (!game.isStarted) return;
		if (game.isEnded) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) {
			this.logger.info('Reversi:putStoneToGame user is not player');
			return;
		}

		const myColor =
			((game.user1Id === user.id) && game.black === 1) || ((game.user2Id === user.id) && game.black === 2)
				? true
				: false;

		const engine = Reversi.Serializer.restoreGame({
			map: game.map,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			logs: game.logs,
		});

		if (engine.turn !== myColor) {
			this.logger.info('Reversi:putStoneToGame bad turn');
			return;
		}
		if (!engine.canPut(myColor, pos)) {
			this.logger.info('Reversi:putStoneToGame can not Putable');
			return;
		}

		engine.putStone(pos);

		const logs = Reversi.Serializer.deserializeLogs(game.logs);

		const log = {
			time: Date.now(),
			player: myColor,
			operation: 'put',
			pos,
		} as const;

		logs.push(log);

		const serializeLogs = Reversi.Serializer.serializeLogs(logs);

		const crc32 = engine.calcCrc32().toString();

		const updatedGame = {
			...game,
			crc32,
			logs: serializeLogs,
		};
		this.cacheGame(updatedGame);

		this.globalEventService.publishReversiGameStream(game.id, 'log', {
			...log,
			id: id ?? null,
		});

		const remote_user = user.id === game.user1Id ? game.user2 : game.user1;
		if (user.host === null && remote_user && remote_user.host) {
			if (game.federationId === null) throw new Error('game.federationId===null');
			const update = await this.apRendererService.renderReversiUpdate(user, remote_user as MiRemoteUser, {
				game_session_id: game.federationId,
				type: 'putstone',
				pos,
			});
			const content = this.apRendererService.addContext(update);
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: user.id,
				host: null,
			}, content);
			dm.addDirectRecipe(remote_user as MiRemoteUser);
			trackPromise(dm.execute());
		}

		if (engine.isEnded) {
			let winnerId;
			if (engine.winner === true) {
				winnerId = game.black === 1 ? game.user1Id : game.user2Id;
			} else if (engine.winner === false) {
				winnerId = game.black === 1 ? game.user2Id : game.user1Id;
			} else {
				winnerId = null;
			}

			await this.endGame(updatedGame, winnerId, null);
		} else {
			this.redisClient.setex(`reversi:game:turnTimer:${game.id}:${engine.turn ? '1' : '0'}`, updatedGame.timeLimitForEachTurn, '');
		}
	}

	@bindThis
	public async surrender(gameId: MiReversiGame['id'], user: MiUser) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (game.isEnded) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;

		const winnerId = game.user1Id === user.id ? game.user2Id : game.user1Id;
		const remote_user = game.user1Id === user.id ? game.user2 : game.user1;
		if (user.host === null && remote_user && remote_user.host != null && game.federationId !== null) {
			const leave = await this.apRendererService.renderReversiLeave(user, remote_user as MiRemoteUser, {
				game_session_id: game.federationId,
			});
			const content = this.apRendererService.addContext(leave);
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: user.id,
				host: null,
			}, content);
			dm.addDirectRecipe(remote_user as MiRemoteUser);
			trackPromise(dm.execute());
		}
		await this.endGame(game, winnerId, 'surrender');
	}

	@bindThis
	public async checkTimeout(gameId: MiReversiGame['id']) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (game.isEnded) return;
		//連合プレイの場合配送遅延などの影響で正しく時間制限するのが難しいので時間制限しない
		if (game.federationId) return;

		const engine = Reversi.Serializer.restoreGame({
			map: game.map,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			logs: game.logs,
		});

		if (engine.turn == null) return;

		const timer = await this.redisClient.exists(`reversi:game:turnTimer:${game.id}:${engine.turn ? '1' : '0'}`);

		if (timer === 0) {
			const winnerId = engine.turn ? (game.black === 1 ? game.user2Id : game.user1Id) : (game.black === 1 ? game.user1Id : game.user2Id);

			await this.endGame(game, winnerId, 'timeout');
		}
	}

	@bindThis
	public async cancelGame(gameId: MiReversiGame['id'], user: MiUser) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');
		if (game.isStarted) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;

		await this.reversiGamesRepository.delete(game.id);
		this.deleteGameCache(game.id);

		this.globalEventService.publishReversiGameStream(game.id, 'canceled', {
			userId: user.id,
		});
		const remote_user = game.user1Id === user.id ? game.user2 : game.user1;
		if (user.host === null && remote_user && remote_user.host != null && game.federationId !== null) {
			const leave = await this.apRendererService.renderReversiLeave(user, remote_user as MiRemoteUser, {
				game_session_id: game.federationId,
			});
			const content = this.apRendererService.addContext(leave);
			const dm = this.apDeliverManagerService.createDeliverManager({
				id: user.id,
				host: null,
			}, content);
			dm.addDirectRecipe(remote_user as MiRemoteUser);
			trackPromise(dm.execute());
		}
	}

	@bindThis
	public async get(id: MiReversiGame['id']): Promise<MiReversiGame | null> {
		const cached = await this.redisClient.get(`reversi:game:cache:${id}`);
		if (cached != null) {
			// TODO: この辺りのデシリアライズ処理をどこか別のサービスに切り出したい
			const parsed = JSON.parse(cached) as Serialized<MiReversiGame>;
			return {
				...parsed,
				startedAt: parsed.startedAt != null ? new Date(parsed.startedAt) : null,
				endedAt: parsed.endedAt != null ? new Date(parsed.endedAt) : null,
				user1: parsed.user1 != null ? {
					...parsed.user1,
					avatar: null,
					banner: null,
					updatedAt: parsed.user1.updatedAt != null ? new Date(parsed.user1.updatedAt) : null,
					lastActiveDate: parsed.user1.lastActiveDate != null ? new Date(parsed.user1.lastActiveDate) : null,
					lastFetchedAt: parsed.user1.lastFetchedAt != null ? new Date(parsed.user1.lastFetchedAt) : null,
					movedAt: parsed.user1.movedAt != null ? new Date(parsed.user1.movedAt) : null,
				} : null,
				user2: parsed.user2 != null ? {
					...parsed.user2,
					avatar: null,
					banner: null,
					updatedAt: parsed.user2.updatedAt != null ? new Date(parsed.user2.updatedAt) : null,
					lastActiveDate: parsed.user2.lastActiveDate != null ? new Date(parsed.user2.lastActiveDate) : null,
					lastFetchedAt: parsed.user2.lastFetchedAt != null ? new Date(parsed.user2.lastFetchedAt) : null,
					movedAt: parsed.user2.movedAt != null ? new Date(parsed.user2.movedAt) : null,
				} : null,
			};
		} else {
			const game = await this.reversiGamesRepository.findOne({
				where: { id },
				relations: ['user1', 'user2'],
			});
			if (game == null) return null;

			this.cacheGame(game);

			return game;
		}
	}

	@bindThis
	public async checkCrc(gameId: MiReversiGame['id'], crc32: string | number) {
		const game = await this.get(gameId);
		if (game == null) throw new Error('game not found');

		if (crc32.toString() !== game.crc32) {
			return game;
		} else {
			return null;
		}
	}

	@bindThis
	public dispose(): void {
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
