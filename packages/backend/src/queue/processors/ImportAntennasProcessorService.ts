/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import Logger from '@/logger.js';
import type { AntennasRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import { DBAntennaImportJobData } from '../types.js';
import type * as Bull from 'bullmq';

// NOTE: api.json には現れない (endpoint の paramDef ではなく、インポートファイルの検証用) スキーマ。
const exportedAntennaSchema = v.object({
	name: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100)),
	src: v.picklist(['home', 'all', 'users', 'list', 'users_blacklist']),
	userListAccts: v.nullish(v.array(v.string())),
	keywords: v.array(v.array(v.string())),
	excludeKeywords: v.array(v.array(v.string())),
	users: v.array(v.string()),
	caseSensitive: v.boolean(),
	localOnly: v.optional(v.boolean()),
	excludeBots: v.optional(v.boolean()),
	withReplies: v.boolean(),
	withFile: v.boolean(),
	excludeNotesInSensitiveChannel: v.optional(v.boolean()),
});

export type ExportedAntenna = v.InferOutput<typeof exportedAntennaSchema>;

@Injectable()
export class ImportAntennasProcessorService {
	private logger: Logger;

	constructor (
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-antennas');
	}

	@bindThis
	public async process(job: Bull.Job<DBAntennaImportJobData>): Promise<void> {
		const now = new Date();
		try {
			for (const antenna of job.data.antenna) {
				if (antenna.keywords.length === 0 || antenna.keywords[0].every(x => x === '')) continue;
				if (!v.safeParse(exportedAntennaSchema, antenna).success) {
					this.logger.warn('Validation Failed');
					continue;
				}
				const result = await this.antennasRepository.insertOne({
					id: this.idService.gen(now.getTime()),
					lastUsedAt: now,
					userId: job.data.user.id,
					name: antenna.name,
					src: antenna.src === 'list' && antenna.userListAccts ? 'users' : antenna.src,
					userListId: null,
					keywords: antenna.keywords,
					excludeKeywords: antenna.excludeKeywords,
					users: (antenna.src === 'list' && antenna.userListAccts !== null ? antenna.userListAccts : antenna.users).filter(Boolean),
					caseSensitive: antenna.caseSensitive,
					localOnly: antenna.localOnly,
					excludeBots: antenna.excludeBots,
					withReplies: antenna.withReplies,
					withFile: antenna.withFile,
					excludeNotesInSensitiveChannel: antenna.excludeNotesInSensitiveChannel,
				});
				this.logger.succ('Antenna created: ' + result.id);
				this.globalEventService.publishInternalEvent('antennaCreated', result);
			}
		} catch (err: any) {
			this.logger.error(err);
		}
	}
}
