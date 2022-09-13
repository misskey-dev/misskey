import { Inject, Injectable } from '@nestjs/common';
import Logger from '@/logger.js';

@Injectable()
export class DriveLoggerService {
	public logger: Logger;

	constructor(
	) {
		this.logger = new Logger('drive', 'blue');
	}
}
