import { Inject, Injectable } from '@nestjs/common';
import Logger from '@/logger.js';

@Injectable()
export class QueueLoggerService {
	public logger: Logger;

	constructor(
	) {
		this.logger = new Logger('queue', 'orange');
	}
}
