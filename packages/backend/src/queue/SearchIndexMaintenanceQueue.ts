/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import { QUEUE, baseQueueOptions } from './const.js';
import type { Config } from '@/config.js';
import type { Job, RedisClient } from 'bullmq';
import type { SearchIndexMaintenanceJobData, SearchIndexMaintenanceRequest, ThinUser } from './types.js';

export class SearchIndexMaintenanceError extends Error {
	constructor(
		public readonly code: 'MEILISEARCH_NOT_ACTIVE' | 'ALREADY_RUNNING' | 'INVALID_PARAM' | 'SEARCH_INDEX_RECOVERY_REQUIRED',
		message: string,
		public readonly jobId?: string,
	) {
		super(message);
	}
}

export type SearchIndexMutation = { jobId: string; id: string; taskUid?: number };

const deduplicationId = 'meilisearch-note-index-maintenance';

// Check the BullMQ lease and reserve the write in one Redis operation. The reservation
// has no expiry: even a stalled worker can resume immediately before sending the request.
const beginMutation = `
if redis.call('GET', KEYS[2]) ~= ARGV[1] then return -1 end
if redis.call('EXISTS', KEYS[1]) ~= 0 then return 0 end
redis.call('HSET', KEYS[1], 'jobId', ARGV[2], 'id', ARGV[3])
return 1
`;

const recordTask = `
if redis.call('HGET', KEYS[1], 'id') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'taskUid', ARGV[2])
return 1
`;

const releaseMutation = `
if redis.call('HGET', KEYS[1], 'id') ~= ARGV[1] then return 0 end
return redis.call('DEL', KEYS[1])
`;

export class SearchIndexMaintenanceQueue {
	public readonly queue: Queue<SearchIndexMaintenanceJobData>;
	private readonly mutationKey: string;
	private redisClient?: Promise<RedisClient>;

	constructor(private readonly config: Config, failFast = false) {
		const options = baseQueueOptions(config, QUEUE.SEARCH_INDEX_MAINTENANCE);
		this.queue = new Queue(QUEUE.SEARCH_INDEX_MAINTENANCE, failFast ? {
			...options,
			connection: {
				...config.redisForJobQueue,
				keyPrefix: undefined,
				connectTimeout: 5_000,
				enableOfflineQueue: false,
				retryStrategy: () => null,
			},
		} : options);
		this.mutationKey = this.queue.toKey('pending-mutation');
	}

	public async enqueue(request: SearchIndexMaintenanceRequest, actor: ThinUser | null): Promise<{ jobId: string }> {
		if (this.config.fulltextSearch?.provider !== 'meilisearch' || !this.config.meilisearch) {
			throw new SearchIndexMaintenanceError('MEILISEARCH_NOT_ACTIVE', 'Meilisearch provider is not active.');
		}

		if (request.operation === 'reindex') {
			const { sinceDate, untilDate } = request;
			const isValidDate = (date: number | null | undefined) => date == null
				|| (Number.isSafeInteger(date) && Math.abs(date) <= 8_640_000_000_000_000);
			if (!isValidDate(sinceDate) || !isValidDate(untilDate) || (sinceDate != null && untilDate != null && sinceDate >= untilDate)) {
				throw new SearchIndexMaintenanceError('INVALID_PARAM', 'Provide valid timestamps with sinceDate earlier than untilDate.');
			}
		}

		const pending = await this.getPendingMutation();
		if (pending != null) {
			const current = await this.queue.getDeduplicationJobId(deduplicationId);
			if (current != null) throw this.alreadyRunning(current);

			throw new SearchIndexMaintenanceError(
				'SEARCH_INDEX_RECOVERY_REQUIRED',
				'A previous Meilisearch write could not be verified. See docs/meilisearch-maintenance.md before retrying.',
				pending.jobId,
			);
		}

		const jobId = randomUUID();
		const job = await this.queue.add(request.operation === 'reset' ? 'resetNoteIndex' : 'reIndexNotes', {
			...request,
			actor: actor == null ? null : { id: actor.id },
		}, {
			jobId,
			deduplication: { id: deduplicationId },
			removeOnComplete: { age: 3600 * 24 * 7 },
			removeOnFail: { age: 3600 * 24 * 30 },
		});
		if (job.id !== jobId) throw this.alreadyRunning(job.id);

		return { jobId };
	}

	private alreadyRunning(jobId: string | undefined): SearchIndexMaintenanceError {
		return new SearchIndexMaintenanceError('ALREADY_RUNNING', 'A Meilisearch maintenance job is already queued or running.', jobId);
	}

	private getClient(): Promise<RedisClient> {
		return this.redisClient ??= this.queue.getBackend().client.then(client => {
			client.defineCommand('misskeyBeginSearchMutation', { numberOfKeys: 2, lua: beginMutation });
			client.defineCommand('misskeyRecordSearchTask', { numberOfKeys: 1, lua: recordTask });
			client.defineCommand('misskeyReleaseSearchMutation', { numberOfKeys: 1, lua: releaseMutation });
			return client;
		});
	}

	public async getPendingMutation(): Promise<SearchIndexMutation | null> {
		const client = await this.getClient();
		const { jobId, id, taskUid } = await client.hgetall(this.mutationKey);
		if (jobId == null && id == null && taskUid == null) return null;
		const uid = taskUid == null ? undefined : Number(taskUid);
		if (!jobId || !id || (uid != null && (!Number.isSafeInteger(uid) || uid < 0))) {
			throw new Error('Invalid Meilisearch write reservation. Check the pending-mutation Redis hash.');
		}

		return { jobId, id, taskUid: uid };
	}

	public async beginMutation(job: Job<SearchIndexMaintenanceJobData>): Promise<SearchIndexMutation> {
		if (job.id == null || !job.token) throw new Error('Lost the BullMQ job lock before sending a Meilisearch write.');

		const client = await this.getClient();
		const mutation: SearchIndexMutation = { jobId: job.id, id: randomUUID() };
		const result = await client.runCommand('misskeyBeginSearchMutation', [this.mutationKey, this.queue.toKey(`${job.id}:lock`), job.token, job.id, mutation.id]);
		if (result === -1) throw new Error('Lost the BullMQ job lock before sending a Meilisearch write.');
		if (result !== 1) throw new Error('A previous Meilisearch write is still unresolved.');

		return mutation;
	}

	public async recordTask(mutation: SearchIndexMutation, taskUid: number): Promise<void> {
		const client = await this.getClient();
		const result = await client.runCommand('misskeyRecordSearchTask', [this.mutationKey, mutation.id, taskUid]);
		if (result !== 1) throw new Error(`Lost the Meilisearch write reservation for task ${taskUid}.`);
	}

	public async releaseMutation(mutation: SearchIndexMutation): Promise<void> {
		const client = await this.getClient();
		await client.runCommand('misskeyReleaseSearchMutation', [this.mutationKey, mutation.id]);
	}
}
