import { Inject, Injectable } from '@nestjs/common';
import Logger from '@/logger.js';

@Injectable()
export class ApiLoggerService {
	public logger: Logger;

	constructor(
	) {
		this.logger = new Logger('api');
	}
}
