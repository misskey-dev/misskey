/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ReactionsBufferingService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisインスタンスにする
	) {
	}

	@bindThis
	public async create(note: MiNote, reaction: string) {
		this.redisClient.hincrby(`reactionsBuffer:${note.id}`, reaction, 1);
	}

	@bindThis
	public async delete(note: MiNote, reaction: string) {
		this.redisClient.hincrby(`reactionsBuffer:${note.id}`, reaction, -1);
	}

	@bindThis
	public async get(note: MiNote) {
		const result = await this.redisClient.hgetall(`reactionsBuffer:${note.id}`);
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
			pipeline.hgetall(`reactionsBuffer:${note.id}`);
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
}
