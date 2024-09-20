/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';

const REDIS_PREFIX = 'reactionsBuffer';

@Injectable()
export class ReactionsBufferingService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisインスタンスにする
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
	public async get(note: MiNote) {
		const result = await this.redisClient.hgetall(`${REDIS_PREFIX}:${note.id}`);
		const delta = {};
		for (const [name, count] of Object.entries(result)) {
			delta[name] = parseInt(count);
		}
		return delta;
	}

	@bindThis
	public async getMany(notes: MiNote[]) {
		const deltas = new Map<MiNote['id'], Record<string, number>>();

		const pipeline = this.redisClient.pipeline();
		for (const note of notes) {
			pipeline.hgetall(`${REDIS_PREFIX}:${note.id}`);
		}
		const results = await pipeline.exec();

		for (let i = 0; i < notes.length; i++) {
			const note = notes[i];
			const result = results![i][1];
			const delta = {};
			for (const [name, count] of Object.entries(result)) {
				delta[name] = parseInt(count);
			}
			deltas.set(note.id, delta);
		}

		return deltas;
	}

	// TODO: scanは重い可能性があるので、別途 bufferedNoteIds を直接Redis上に持っておいてもいいかもしれない
	@bindThis
	public async bake() {
		const bufferedNoteIds = [];
		let cursor = '0';
		do {
			const result = await this.redisClient.scan(cursor, 'MATCH', `${REDIS_PREFIX}:*`, 'COUNT', '1000');
			cursor = result[0];
			bufferedNoteIds.push(...result[1]);
		} while (cursor !== '0');

		console.log(bufferedNoteIds);
	}
}
