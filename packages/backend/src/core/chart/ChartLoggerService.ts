import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';

@Injectable()
export class ChartLoggerService {
	public logger: Logger;

	constructor(
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('chart', 'white', process.env.NODE_ENV !== 'test');
	}
}
