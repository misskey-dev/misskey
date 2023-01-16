import { Inject, Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ApLoggerService {
	public logger: Logger;

	constructor(
		private remoteLoggerService: RemoteLoggerService,
	) {
		this.logger = this.remoteLoggerService.logger.createSubLogger('ap', 'magenta');
	}
}
