import { Inject, Injectable } from '@/di-decorators.js';
import type Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class RemoteLoggerService {
	public logger: Logger;

	constructor(
		@Inject(DI.LoggerService)
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('remote', 'cyan');
	}
}
