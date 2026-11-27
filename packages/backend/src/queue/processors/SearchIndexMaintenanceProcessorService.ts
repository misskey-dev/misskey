/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { MeilisearchTaskFailedError, SearchService } from '@/core/SearchService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { bindThis } from '@/decorators.js';
import { SearchIndexMaintenanceQueue } from '../SearchIndexMaintenanceQueue.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { Job } from 'bullmq';
import type { RunSearchIndexMutation } from '@/core/SearchService.js';
import type Logger from '@/logger.js';
import type { ModerationLogPayloads } from '@/types.js';
import type { SearchIndexMutation } from '../SearchIndexMaintenanceQueue.js';
import type { SearchIndexMaintenanceJobData, ThinUser } from '../types.js';

@Injectable()
export class SearchIndexMaintenanceProcessorService {
	private readonly logger: Logger;

	constructor(
		private searchService: SearchService,
		private maintenanceQueue: SearchIndexMaintenanceQueue,
		private moderationLogService: ModerationLogService,
		queueLoggerService: QueueLoggerService,
	) {
		this.logger = queueLoggerService.logger.createSubLogger('meilisearch-maintenance');
	}

	@bindThis
	public async process(job: Job<SearchIndexMaintenanceJobData>, signal?: AbortSignal): Promise<string> {
		const data = job.data;
		const jobId = String(job.id);
		const isReset = data.operation === 'reset';
		this.logger.info(`Starting ${job.name} (${jobId}, actor=${data.actor?.id ?? 'CLI'})`);

		try {
			signal?.throwIfAborted();
			const pending = await this.maintenanceQueue.getPendingMutation();
			if (pending != null) {
				if (pending.taskUid == null) {
					throw new Error('A Meilisearch write may have been submitted. See docs/meilisearch-maintenance.md before retrying.');
				}
				await this.finishMutation(job, pending, pending.taskUid, signal);
			}

			if (isReset) {
				const taskUid = pending?.jobId === jobId && pending.taskUid != null
					? pending.taskUid
					: await this.resetIndex(job, signal);
				await this.log(data.actor, 'resetNoteIndexCompleted', { jobId, taskUid });
				return `Cleared the Meilisearch note index (task ${taskUid}).`;
			}

			const indexedCount = await this.searchService.reIndexNotes({
				sinceDate: data.sinceDate,
				untilDate: data.untilDate,
				runMutation: (submit, noteIds) => this.runMutation(job, submit, signal, noteIds),
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

	private async resetIndex(job: Job<SearchIndexMaintenanceJobData>, signal?: AbortSignal): Promise<number> {
		if (job.data.taskUid != null) {
			await this.searchService.waitForMeilisearchTask(job.data.taskUid, signal);
			return job.data.taskUid;
		}

		if (job.attemptsStarted > 1) {
			throw new Error('The Meilisearch reset was interrupted before its task was recorded.');
		}

		return await this.searchService.clearNoteIndex(submit => this.runMutation(job, submit, signal));
	}

	private async runMutation(
		job: Job<SearchIndexMaintenanceJobData>, submit: () => Promise<number>, signal?: AbortSignal, noteIds?: string[],
	): ReturnType<RunSearchIndexMutation> {
		signal?.throwIfAborted();
		const mutation = await this.maintenanceQueue.beginMutation(job, noteIds);
		if (signal?.aborted) {
			// This execution knows it has not sent the write.
			await this.maintenanceQueue.releaseMutation(mutation);
			signal.throwIfAborted();
		}

		const taskUid = await this.submitMutation(mutation, submit);
		const indexedCount = await this.finishMutation(job, mutation, taskUid, signal);
		return { taskUid, indexedCount };
	}

	private async submitMutation(mutation: SearchIndexMutation, submit: () => Promise<number>): Promise<number> {
		// An interrupted response may mean Meilisearch accepted the write. Keep the reservation on errors.
		const taskUid = await submit();
		await this.maintenanceQueue.recordTask(mutation, taskUid);
		return taskUid;
	}

	private async finishMutation(job: Job<SearchIndexMaintenanceJobData>, mutation: SearchIndexMutation, taskUid: number, signal?: AbortSignal): Promise<number | undefined> {
		if (job.data.operation === 'reset' && mutation.jobId === job.id) {
			// If the job stalls after releasing the reservation, its next owner can still find the original reset.
			await job.updateData({ ...job.data, taskUid });
		}

		try {
			await this.searchService.waitForMeilisearchTask(taskUid, signal);
		} catch (err) {
			// A failed cleanup leaves the deleted documents unreconciled.
			if (err instanceof MeilisearchTaskFailedError && !mutation.cleanup) {
				await this.maintenanceQueue.releaseMutation(mutation);
			}
			throw err;
		}
		let indexedCount: number | undefined;
		if (mutation.noteIds != null && !mutation.cleanup) {
			indexedCount = await this.searchService.reconcileIndexedNotes(mutation.noteIds, async submit => {
				signal?.throwIfAborted();
				const cleanup = await this.maintenanceQueue.beginCleanup(job, mutation);
				// Keep the original batch IDs in the reservation until its cleanup has finished.
				signal?.throwIfAborted();
				const cleanupTaskUid = await this.submitMutation(cleanup, submit);
				await this.searchService.waitForMeilisearchTask(cleanupTaskUid, signal);
				await this.maintenanceQueue.releaseMutation(cleanup);
				return { taskUid: cleanupTaskUid };
			});
		}
		await this.maintenanceQueue.releaseMutation(mutation);
		return indexedCount;
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
