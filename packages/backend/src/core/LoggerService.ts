import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class LoggerService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public getLogger(domain: string, color?: string | undefined, store?: boolean) {
		return new Logger(domain, color, store);
	}
}
