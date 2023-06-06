import { EventEmitter } from 'events';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as WebSocket from 'ws';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, AccessToken } from '@/models/index.js';
import type { Config } from '@/config.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { LocalUser } from '@/models/entities/User';
import { AuthenticateService, AuthenticationError } from './AuthenticateService.js';
import MainStreamConnection from './stream/index.js';
import { ChannelsService } from './stream/ChannelsService.js';
import type * as http from 'node:http';

@Injectable()
export class StreamingApiServerService {
	#wss: WebSocket.WebSocketServer;
	#connections = new Map<WebSocket.WebSocket, number>();
	#cleanConnectionsIntervalId: NodeJS.Timeout | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private cacheService: CacheService,
		private noteReadService: NoteReadService,
		private authenticateService: AuthenticateService,
		private channelsService: ChannelsService,
		private notificationService: NotificationService,
	) {
	}

	@bindThis
	public attach(server: http.Server): void {
		this.#wss = new WebSocket.WebSocketServer({
			noServer: true,
		});

		server.on('upgrade', async (request, socket, head) => {
			if (request.url == null) {
				socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
				socket.destroy();
				return;
			}

			const q = new URL(request.url, `http://${request.headers.host}`).searchParams;

			let user: LocalUser | null = null;
			let app: AccessToken | null = null;

			try {
				[user, app] = await this.authenticateService.authenticate(q.get('i'));
			} catch (e) {
				if (e instanceof AuthenticationError) {
					socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				} else {
					socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
				}
				socket.destroy();
				return;
			}

			if (user?.isSuspended) {
				socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
				socket.destroy();
				return;
			}

			const stream = new MainStreamConnection(
				this.channelsService,
				this.noteReadService,
				this.notificationService,
				this.cacheService,
				user, app,
			);

			await stream.init();

			this.#wss.handleUpgrade(request, socket, head, (ws) => {
				this.#wss.emit('connection', ws, request, {
					stream, user, app,
				});
			});
		});

		this.#wss.on('connection', async (connection: WebSocket.WebSocket, request: http.IncomingMessage, ctx: {
			stream: MainStreamConnection,
			user: LocalUser | null;
			app: AccessToken | null
		}) => {
			const { stream, user, app } = ctx;

			const ev = new EventEmitter();

			async function onRedisMessage(_: string, data: string): Promise<void> {
				const parsed = JSON.parse(data);
				ev.emit(parsed.channel, parsed.message);
			}

			this.redisForSub.on('message', onRedisMessage);

			await stream.listen(ev, connection);

			this.#connections.set(connection, Date.now());

			const userUpdateIntervalId = user ? setInterval(() => {
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
				stream.dispose();
				this.redisForSub.off('message', onRedisMessage);
				if (userUpdateIntervalId) clearInterval(userUpdateIntervalId);
			});

			connection.on('message', async (data) => {
				this.#connections.set(connection, Date.now());
				if (data.toString() === 'ping') {
					connection.send('pong');
				}
			});
		});

		this.#cleanConnectionsIntervalId = setInterval(() => {
			const now = Date.now();
			for (const [connection, lastActive] of this.#connections.entries()) {
				if (now - lastActive > 1000 * 60 * 5) {
					connection.terminate();
					this.#connections.delete(connection);
				}
			}
		}, 1000 * 60 * 5);
	}

	@bindThis
	public detach(): Promise<void> {
		if (this.#cleanConnectionsIntervalId) {
			clearInterval(this.#cleanConnectionsIntervalId);
			this.#cleanConnectionsIntervalId = null;
		}
		return new Promise((resolve) => {
			this.#wss.close(() => resolve());
		});
	}
}
