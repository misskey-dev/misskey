/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type * as Redis from 'ioredis';
import type { DataSource, } from 'typeorm';
import { IsNull, Not } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import type { NotesRepository } from '@/models/_.js';
import type { MiNote } from '@/models/Note.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import type { KVs } from '../core.js';
import Chart from '../core.js';
import { name, schema } from './entities/notes.js';

/**
 * ノートに関するチャート
 */
@Injectable()
export default class NotesChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			this.notesRepository.countBy({ userHost: IsNull() }),
			this.notesRepository.countBy({ userHost: Not(IsNull()) }),
		]);

		return {
			'local.total': localCount,
			'remote.total': remoteCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(note: MiNote, isAdditional: boolean): Promise<void> {
		const prefix = note.userHost === null ? 'local' : 'remote';

		await this.commit({
			[`${prefix}.total`]: isAdditional ? 1 : -1,
			[`${prefix}.inc`]: isAdditional ? 1 : 0,
			[`${prefix}.dec`]: isAdditional ? 0 : 1,
			[`${prefix}.diffs.normal`]: note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.renote`]: note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.reply`]: note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.withFile`]: note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		});
	}
}
