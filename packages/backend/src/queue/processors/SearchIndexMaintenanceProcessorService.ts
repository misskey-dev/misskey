/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SearchService } from '@/core/SearchService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { Job } from 'bullmq';
import type Logger from '@/logger.js';
import type { ModerationLogPayloads } from '@/types.js';
import type { DbReIndexNotesJobData, DbResetNoteIndexJobData, ThinUser } from '../types.js';

@Injectable()
export class SearchIndexMaintenanceProcessorService {
	private readonly logger: Logger;

	constructor(
		private searchService: SearchService,
		private moderationLogService: ModerationLogService,
		queueLoggerService: QueueLoggerService,
	) {
		this.logger = queueLoggerService.logger.createSubLogger('meilisearch-maintenance');
	}

	@bindThis
	public async process(job: Job<DbReIndexNotesJobData | DbResetNoteIndexJobData>): Promise<string> {
		const data = job.data;
		const jobId = String(job.id);
		const isReset = data.operation === 'reset';
		this.logger.info(`Starting ${job.name} (${jobId}, actor=${data.actor?.id ?? 'CLI'})`);

		try {
			if (isReset) {
				const taskUid = await this.resetIndex(job, data);
				await this.log(data.actor, 'resetNoteIndexCompleted', { jobId, taskUid });
				return `Cleared the Meilisearch note index (task ${taskUid}).`;
			}

			const indexedCount = await this.searchService.reIndexNotes({
				sinceDate: data.sinceDate,
				untilDate: data.untilDate,
				onBatch: async count => await job.updateProgress({ indexedCount: count }),
			});
			await this.log(data.actor, 'reIndexNotesCompleted', { jobId, indexedCount });
			return `Re-indexed ${indexedCount} notes.`;
		} catch (err) {
			const reason = err instanceof Error ? err.message : String(err);
			await this.log(data.actor, isReset ? 'resetNoteIndexFailed' : 'reIndexNotesFailed', { jobId, reason });
			throw err;
		}
	}

	private async resetIndex(job: Job<DbReIndexNotesJobData | DbResetNoteIndexJobData>, data: DbResetNoteIndexJobData): Promise<number> {
		let taskUid = data.taskUid;
		if (taskUid == null) {
			// An interruption can leave the submission outcome unknown. Resending it could delete newly indexed notes.
			if (data.submissionStarted || job.attemptsStarted > 1) {
				throw new Error('The Meilisearch reset may have been submitted. Check the task history before submitting another reset.');
			}
			await job.updateData({ ...data, submissionStarted: true });
			// A stalled worker may still resume in this process. Verify ownership immediately before deletion.
			if (!job.token || !await job.extendLock(job.token, 30_000)) {
				throw new Error('Lost the job lock before submitting the Meilisearch reset.');
			}
			taskUid = await this.searchService.clearNoteIndex();
			await job.updateData({ ...data, submissionStarted: true, taskUid });
		}

		await this.searchService.waitForMeilisearchTask(taskUid);
		return taskUid;
	}

	private async log<T extends 'resetNoteIndexCompleted' | 'resetNoteIndexFailed' | 'reIndexNotesCompleted' | 'reIndexNotesFailed'>(
		actor: ThinUser | null, type: T, payload: ModerationLogPayloads[T],
	): Promise<void> {
		if (actor == null) return;
		try {
			await this.moderationLogService.log(actor, type, payload);
		} catch (err) {
			this.logger.error(`Failed to log ${type} for ${payload.jobId}`, { error: err });
		}
	}
}
