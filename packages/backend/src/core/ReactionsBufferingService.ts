/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import type { MiUser, NotesRepository } from '@/models/_.js';
import type { Config } from '@/config.js';

const REDIS_DELTA_PREFIX = 'reactionsBufferDeltas';
const REDIS_PAIR_PREFIX = 'reactionsBufferPairs';

@Injectable()
export class ReactionsBufferingService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisForReactions)
		private redisForReactions: Redis.Redis, // TODO: 専用のRedisインスタンスにする

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
	) {
	}

	@bindThis
	public async create(noteId: MiNote['id'], userId: MiUser['id'], reaction: string): Promise<void> {
		const pipeline = this.redisForReactions.pipeline();
		pipeline.hincrby(`${REDIS_DELTA_PREFIX}:${noteId}`, reaction, 1);
		pipeline.lpush(`${REDIS_PAIR_PREFIX}:${noteId}`, `${userId}/${reaction}`);
		pipeline.ltrim(`${REDIS_PAIR_PREFIX}:${noteId}`, 0, 32);
		await pipeline.exec();
	}

	@bindThis
	public async delete(noteId: MiNote['id'], userId: MiUser['id'], reaction: string): Promise<void> {
		const pipeline = this.redisForReactions.pipeline();
		pipeline.hincrby(`${REDIS_DELTA_PREFIX}:${noteId}`, reaction, -1);
		pipeline.lrem(`${REDIS_PAIR_PREFIX}:${noteId}`, 0, `${userId}/${reaction}`);
		await pipeline.exec();
	}

	@bindThis
	public async get(noteId: MiNote['id']): Promise<Record<string, number>> {
		const result = await this.redisForReactions.hgetall(`${REDIS_DELTA_PREFIX}:${noteId}`);
		const delta = {} as Record<string, number>;
		for (const [name, count] of Object.entries(result)) {
			delta[name] = parseInt(count);
		}
		return delta;
	}

	@bindThis
	public async getMany(noteIds: MiNote['id'][]): Promise<Map<MiNote['id'], Record<string, number>>> {
		const deltas = new Map<MiNote['id'], Record<string, number>>();

		const pipeline = this.redisForReactions.pipeline();
		for (const noteId of noteIds) {
			pipeline.hgetall(`${REDIS_DELTA_PREFIX}:${noteId}`);
		}
		const results = await pipeline.exec();

		for (let i = 0; i < noteIds.length; i++) {
			const noteId = noteIds[i];
			const result = results![i][1] as Record<string, string>;
			const delta = {} as Record<string, number>;
			for (const [name, count] of Object.entries(result)) {
				delta[name] = parseInt(count);
			}
			deltas.set(noteId, delta);
		}

		return deltas;
	}

	// TODO: scanは重い可能性があるので、別途 bufferedNoteIds を直接Redis上に持っておいてもいいかもしれない
	@bindThis
	public async bake(): Promise<void> {
		const bufferedNoteIds = [];
		let cursor = '0';
		do {
			// https://github.com/redis/ioredis#transparent-key-prefixing
			const result = await this.redisForReactions.scan(
				cursor,
				'MATCH',
				`${this.config.redis.prefix}:${REDIS_DELTA_PREFIX}:*`,
				'COUNT',
				'1000');

			cursor = result[0];
			bufferedNoteIds.push(...result[1].map(x => x.replace(`${this.config.redis.prefix}:${REDIS_DELTA_PREFIX}:`, '')));
		} while (cursor !== '0');

		const deltas = await this.getMany(bufferedNoteIds);

		// clear
		const pipeline = this.redisForReactions.pipeline();
		for (const noteId of bufferedNoteIds) {
			pipeline.del(`${REDIS_DELTA_PREFIX}:${noteId}`);
		}
		await pipeline.exec();

		// TODO: SQL一個にまとめたい
		for (const [noteId, delta] of deltas) {
			const sql = Object.entries(delta)
				.map(([reaction, count]) =>
					`jsonb_set("reactions", '{${reaction}}', (COALESCE("reactions"->>'${reaction}', '0')::int + ${count})::text::jsonb)`)
				.join(' || ');

			this.notesRepository.createQueryBuilder().update()
				.set({
					reactions: () => sql,
				})
				.where('id = :id', { id: noteId })
				.execute();
		}
	}
}
