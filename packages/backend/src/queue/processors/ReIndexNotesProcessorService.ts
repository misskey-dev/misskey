/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { SearchService } from '@/core/SearchService.js';
import { RoleService } from '@/core/RoleService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbReIndexNotesJobData } from '../types.js';

@Injectable()
export class ReIndexNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private searchService: SearchService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('re-index-notes');
	}

	@bindThis
	public async process(job: Bull.Job<DbReIndexNotesJobData>): Promise<string> {
		const { actor, sinceDate, untilDate } = job.data;
		const startedAt = Date.now();

		this.logger.info(`Start re-indexing notes (actor=${actor.id}, since=${sinceDate ?? '-'}, until=${untilDate ?? '-'})`);

		try {
			const result = await this.searchService.reIndexNotes({
				sinceDate,
				untilDate,
				onBatch: async (progress) => {
					// progress には fetchedCount / errorCount を含むオブジェクトを保存する
					// (総件数を取らないため % ではなく実数で持つ)
					await job.updateProgress(progress);
				},
			});

			const durationMs = Date.now() - startedAt;
			this.logger.succ(`Re-indexing finished: fetched=${result.fetchedCount}, errors=${result.errorNoteIds.length}, duration=${durationMs}ms`);

			await this.notifyCompletion(actor, {
				fetchedCount: result.fetchedCount,
				errorCount: result.errorNoteIds.length,
				durationMs,
			});

			return `re-indexed ${result.fetchedCount} notes (${result.errorNoteIds.length} errors) in ${durationMs}ms`;
		} catch (err) {
			const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
			this.logger.error(`Re-indexing failed: ${reason}`, err as Error);
			await this.notifyFailure(actor, reason);
			throw err;
		}
	}

	@bindThis
	private async notifyCompletion(actor: { id: string }, payload: { fetchedCount: number; errorCount: number; durationMs: number }) {
		const actorUser = await this.usersRepository.findOneBy({ id: actor.id });
		if (actorUser != null) {
			await this.moderationLogService.log(actorUser, 'reIndexNotesCompleted', payload);
		}

		const moderatorIds = await this.roleService.getModeratorIds({ includeAdmins: true, includeRoot: true });
		const event = { ...payload, triggeredAt: Date.now() };
		for (const id of moderatorIds) {
			this.globalEventService.publishAdminStream(id, 'meilisearchReIndexCompleted', event);
		}
	}

	@bindThis
	private async notifyFailure(actor: { id: string }, reason: string) {
		const actorUser = await this.usersRepository.findOneBy({ id: actor.id });
		if (actorUser != null) {
			await this.moderationLogService.log(actorUser, 'reIndexNotesFailed', { reason });
		}
	}
}
