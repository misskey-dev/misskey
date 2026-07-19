/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { readyRef } from '@/boot/ready.js';
import type { Meilisearch } from 'meilisearch';

@Injectable()
export class HealthServerService {
	constructor(
		@Inject(DI.redis)
		private redis: Redis.Redis,

		@Inject(DI.redisForPub)
		private redisForPub: Redis.Redis,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.redisForReactions)
		private redisForReactions: Redis.Redis,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.meilisearch)
		private meilisearch: Meilisearch | null,
	) {}

	@bindThis
	public createServer(): Hono {
		const hono = new Hono();

		hono.get('/', async (ctx) => {
			const status = await Promise.all([
				new Promise<void>((resolve, reject) => readyRef.value ? resolve() : reject()),
				this.redis.ping(),
				this.redisForPub.ping(),
				this.redisForSub.ping(),
				this.redisForTimelines.ping(),
				this.redisForReactions.ping(),
				this.db.query('SELECT 1'),
				...(this.meilisearch ? [this.meilisearch.health()] : []),
			]).then(() => 200 as const, () => 503 as const);

			ctx.status(status);
			ctx.header('Cache-Control', 'no-store');
			return ctx.body(null);
		});

		return hono;
	}
}
