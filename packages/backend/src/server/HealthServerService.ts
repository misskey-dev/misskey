/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { readyRef } from '@/boot/ready.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { MeiliSearch } from 'meilisearch';

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
		private meilisearch: MeiliSearch | null,
	) {}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.get('/', async (request, reply) => {
			reply.code(await Promise.all([
				new Promise<void>((resolve, reject) => readyRef.value ? resolve() : reject()),
				this.redis.ping(),
				this.redisForPub.ping(),
				this.redisForSub.ping(),
				this.redisForTimelines.ping(),
				this.redisForReactions.ping(),
				this.db.query('SELECT 1'),
				...(this.meilisearch ? [this.meilisearch.health()] : []),
			]).then(() => 200, () => 503));
			reply.header('Cache-Control', 'no-store');
		});

		done();
	}
}
