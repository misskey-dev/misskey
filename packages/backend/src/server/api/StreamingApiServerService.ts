import { EventEmitter } from 'events';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as websocket from 'websocket';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, BlockingsRepository, ChannelFollowingsRepository, FollowingsRepository, MutingsRepository, UserProfilesRepository, RenoteMutingsRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { AuthenticateService } from './AuthenticateService.js';
import MainStreamConnection from './stream/index.js';
import { ChannelsService } from './stream/ChannelsService.js';
import type { ParsedUrlQuery } from 'querystring';
import type * as http from 'node:http';

@Injectable()
export class StreamingApiServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	
		private globalEventService: GlobalEventService,
		private noteReadService: NoteReadService,
		private authenticateService: AuthenticateService,
		private channelsService: ChannelsService,
		private notificationService: NotificationService,
	) {
	}

	@bindThis
	public attachStreamingApi(server: http.Server) {
		// Init websocket server
		const ws = new websocket.server({
			httpServer: server,
		});

		ws.on('request', async (request) => {
			const q = request.resourceURL.query as ParsedUrlQuery;

			// TODO: トークンが間違ってるなどしてauthenticateに失敗したら
			// コネクション切断するなりエラーメッセージ返すなりする
			// (現状はエラーがキャッチされておらずサーバーのログに流れて邪魔なので)
			const [user, miapp] = await this.authenticateService.authenticate(q.i as string);

			if (user?.isSuspended) {
				request.reject(400);
				return;
			}

			const connection = request.accept();

			const ev = new EventEmitter();

			async function onRedisMessage(_: string, data: string): Promise<void> {
				const parsed = JSON.parse(data);
				ev.emit(parsed.channel, parsed.message);
			}

			this.redisSubscriber.on('message', onRedisMessage);

			const main = new MainStreamConnection(
				this.followingsRepository,
				this.mutingsRepository,
				this.renoteMutingsRepository,
				this.blockingsRepository,
				this.channelFollowingsRepository,
				this.userProfilesRepository,
				this.channelsService,
				this.globalEventService,
				this.noteReadService,
				this.notificationService,
				connection, ev, user, miapp,
			);

			const intervalId = user ? setInterval(() => {
				this.usersRepository.update(user.id, {
					lastActiveDate: new Date(),
				});
			}, 1000 * 60 * 5) : null;
			if (user) {
				this.usersRepository.update(user.id, {
					lastActiveDate: new Date(),
				});
			}

			connection.once('close', () => {
				ev.removeAllListeners();
				main.dispose();
				this.redisSubscriber.off('message', onRedisMessage);
				if (intervalId) clearInterval(intervalId);
			});

			connection.on('message', async (data) => {
				if (data.type === 'utf8' && data.utf8Data === 'ping') {
					connection.send('pong');
				}
			});
		});
	}
}
