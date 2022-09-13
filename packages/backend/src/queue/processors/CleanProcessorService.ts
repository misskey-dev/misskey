import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan, MoreThan } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { UserIps } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type Logger from '@/logger.js';
import type Bull from 'bull';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class CleanProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('userIpsRepository')
		private userIpsRepository: typeof UserIps,

		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('clean');
	}

	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.#logger.info('Cleaning...');

		this.userIpsRepository.delete({
			createdAt: LessThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 90))),
		});

		this.#logger.succ('Cleaned.');
		done();
	}
}
