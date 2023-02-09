import { Inject, Injectable } from '@/di-decorators.js';
import type Logger from '@/logger.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class ApLoggerService {
	public logger: Logger;

	constructor(
		@Inject(DI.RemoteLoggerService)
		private remoteLoggerService: RemoteLoggerService,
	) {
		this.logger = this.remoteLoggerService.logger.createSubLogger('ap', 'magenta');
	}
}
