/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'events';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as WebSocket from 'ws';
import { Hono } from 'hono';
import { upgradeWebSocket } from '@hono/node-server';
import type { HttpBindings } from '@hono/node-server';
import { DI } from '@/di-symbols.js';
import type { MiAccessToken } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { MiLocalUser } from '@/models/User.js';
import { UserService } from '@/core/UserService.js';
import { AuthenticateService, AuthenticationError } from './AuthenticateService.js';
import MainStreamConnection, { ConnectionRequest } from './stream/Connection.js';
import type * as http from 'node:http';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

type StreamingContext = {
	stream: MainStreamConnection;
	user: MiLocalUser | null;
	app: MiAccessToken | null;
};

@Injectable()
export class StreamingApiServerService {
	#wss: WebSocket.WebSocketServer | null = null;
	#connections = new Map<WebSocket.WebSocket, number>();
	#pendingConnections = new WeakMap<http.IncomingMessage, StreamingContext>();
	#cleanConnectionsIntervalId: NodeJS.Timeout | null = null;
	#globalEv: EventEmitter | null = null;
	#initialized = false;

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		private moduleRef: ModuleRef,
		private authenticateService: AuthenticateService,
		private usersService: UserService,
	) {
	}

	@bindThis
	public createWebSocketServer(): WebSocket.WebSocketServer {
		this.initialize();
		return this.#wss!;
	}

	@bindThis
	public createServer(): Hono {
		this.initialize();

		const hono = new Hono<{ Bindings: HttpBindings }>();

		hono.get('/streaming', async (ctx, next) => {
			if (ctx.req.header('upgrade')?.toLowerCase() !== 'websocket') {
				await next();
				return;
			}

			const incoming = ctx.env.incoming;
			if (incoming == null) {
				return ctx.body(null, 400);
			}

			// https://datatracker.ietf.org/doc/html/rfc6750.html#section-2.1
			// Note that the standard WHATWG WebSocket API does not support setting any headers,
			// but non-browser apps may still be able to set it.
			const authorization = ctx.req.header('authorization');
			const token = authorization?.startsWith('Bearer ')
				? authorization.slice(7)
				: ctx.req.query('i');

			let user: MiLocalUser | null = null;
			let app: MiAccessToken | null = null;

			try {
				[user, app] = await this.authenticateService.authenticate(token);

				if (app !== null && !app.permission.some(p => p === 'read:account')) {
					throw new AuthenticationError('Your app does not have necessary permissions to use websocket API.');
				}
			} catch (e) {
				if (e instanceof AuthenticationError) {
					ctx.header('WWW-Authenticate', 'Bearer realm="Misskey", error="invalid_token", error_description="Failed to authenticate"');
					return ctx.body(null, 401);
				}

				return ctx.body(null, 500);
			}

			if (user?.isSuspended) {
				return ctx.body(null, 403);
			}

			const contextId = ContextIdFactory.create();
			this.moduleRef.registerRequestByContextId<ConnectionRequest>({
				user,
				token: app,
			}, contextId);
			const stream = await this.moduleRef.create(MainStreamConnection, contextId);
			await stream.init();

			this.#pendingConnections.set(incoming, {
				stream,
				user,
				app,
			});

			return await upgradeWebSocket(ctx, {});
		});

		return hono as unknown as Hono;
	}

	@bindThis
	private initialize(): void {
		if (this.#initialized) {
			return;
		}

		this.#initialized = true;
		this.#wss = new WebSocket.WebSocketServer({
			noServer: true,
		});
		this.#globalEv = new EventEmitter();

		this.redisForSub.on('message', (_: string, data: string) => {
			const parsed = JSON.parse(data);
			this.#globalEv!.emit('message', parsed);
		});

		this.#wss.on('connection', async (connection: WebSocket.WebSocket, request: http.IncomingMessage) => {
			const ctx = this.#pendingConnections.get(request);
			if (ctx == null) {
				connection.close();
				return;
			}

			this.#pendingConnections.delete(request);

			const { stream, user } = ctx;

			const ev = new EventEmitter();

			function onRedisMessage(data: any): void {
				ev.emit(data.channel, data.message);
			}

			this.#globalEv!.on('message', onRedisMessage);

			await stream.listen(ev, connection);

			this.#connections.set(connection, Date.now());

			const userUpdateIntervalId = user ? setInterval(() => {
				this.usersService.updateLastActiveDate(user);
			}, 1000 * 60 * 5) : null;
			if (user) {
				this.usersService.updateLastActiveDate(user);
			}

			connection.once('close', () => {
				ev.removeAllListeners();
				stream.dispose();
				this.#globalEv!.off('message', onRedisMessage);
				this.#connections.delete(connection);
				if (userUpdateIntervalId) clearInterval(userUpdateIntervalId);
			});

			connection.on('pong', () => {
				this.#connections.set(connection, Date.now());
			});
		});

		// 一定期間通信が無いコネクションは実際には切断されている可能性があるため定期的にterminateする
		this.#cleanConnectionsIntervalId = setInterval(() => {
			const now = Date.now();
			for (const [connection, lastActive] of this.#connections.entries()) {
				if (now - lastActive > 1000 * 60 * 2) {
					connection.terminate();
					this.#connections.delete(connection);
				} else {
					connection.ping();
				}
			}
		}, 1000 * 60);
	}

	@bindThis
	public detach(): Promise<void> {
		if (this.#wss == null) {
			return Promise.resolve();
		}

		if (this.#cleanConnectionsIntervalId) {
			clearInterval(this.#cleanConnectionsIntervalId);
			this.#cleanConnectionsIntervalId = null;
		}
		return new Promise((resolve) => {
			this.#wss!.close(() => resolve());
		});
	}
}
