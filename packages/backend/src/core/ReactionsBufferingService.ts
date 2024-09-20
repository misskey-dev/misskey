/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import type { NotesRepository } from '@/models/_.js';
import type { Config } from '@/config.js';

const REDIS_PREFIX = 'reactionsBuffer';

@Injectable()
export class ReactionsBufferingService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisインスタンスにする

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
	) {
	}

	@bindThis
	public async create(note: MiNote, reaction: string) {
		this.redisClient.hincrby(`${REDIS_PREFIX}:${note.id}`, reaction, 1);
	}

	@bindThis
	public async delete(note: MiNote, reaction: string) {
		this.redisClient.hincrby(`${REDIS_PREFIX}:${note.id}`, reaction, -1);
	}

	@bindThis
	public async get(noteId: MiNote['id']): Promise<Record<string, number>> {
		const result = await this.redisClient.hgetall(`${REDIS_PREFIX}:${noteId}`);
		const delta = {} as Record<string, number>;
		for (const [name, count] of Object.entries(result)) {
			delta[name] = parseInt(count);
		}
		return delta;
	}

	@bindThis
	public async getMany(noteIds: MiNote['id'][]): Promise<Map<MiNote['id'], Record<string, number>>> {
		const deltas = new Map<MiNote['id'], Record<string, number>>();

		const pipeline = this.redisClient.pipeline();
		for (const noteId of noteIds) {
			pipeline.hgetall(`${REDIS_PREFIX}:${noteId}`);
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
			const result = await this.redisClient.scan(cursor, 'MATCH', `${this.config.redis.prefix}:${REDIS_PREFIX}:*`, 'COUNT', '1000');
			console.log(result);
			cursor = result[0];
			bufferedNoteIds.push(...result[1].map(x => x.replace(`${this.config.redis.prefix}:${REDIS_PREFIX}:`, '')));
		} while (cursor !== '0');

		const deltas = await this.getMany(bufferedNoteIds);

		// clear
		const pipeline = this.redisClient.pipeline();
		for (const noteId of bufferedNoteIds) {
			pipeline.del(`${REDIS_PREFIX}:${noteId}`);
		}
		await pipeline.exec();

		// TODO: SQL一個にまとめたい
		for (const [noteId, delta] of deltas) {
			const sqls = [] as string[];
			for (const [reaction, count] of Object.entries(delta)) {
				sqls.push(`jsonb_set("reactions", '{${reaction}}', (COALESCE("reactions"->>'${reaction}', '0')::int + ${count})::text::jsonb)`);
			}
			this.notesRepository.createQueryBuilder().update()
				.set({
					reactions: () => sqls.join(' || '),
				})
				.where('id = :id', { id: noteId })
				.execute();
		}
	}
}
