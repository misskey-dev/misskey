import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UserIps } from '@/models/index.js';
import { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class CleanProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userIpsRepository)
		private userIpsRepository: typeof UserIps,

		private queueLoggerService: QueueLoggerService,
	) {
		this.#logger = this.queueLoggerService.logger.createSubLogger('clean');
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
