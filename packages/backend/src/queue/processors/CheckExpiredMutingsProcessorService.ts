import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CheckExpiredMutingsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private globalEventService: GlobalEventService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('check-expired-mutings');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.logger.info('Checking expired mutings...');

		const expired = await this.mutingsRepository.createQueryBuilder('muting')
			.where('muting.expiresAt IS NOT NULL')
			.andWhere('muting.expiresAt < :now', { now: new Date() })
			.innerJoinAndSelect('muting.mutee', 'mutee')
			.getMany();

		if (expired.length > 0) {
			await this.mutingsRepository.delete({
				id: In(expired.map(m => m.id)),
			});

			for (const m of expired) {
				this.globalEventService.publishUserEvent(m.muterId, 'unmute', m.mutee!);
			}
		}

		this.logger.succ('All expired mutings checked.');
		done();
	}
}
