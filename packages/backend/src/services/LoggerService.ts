import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';

@Injectable()
export class LoggerService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,
	) {
	}
}
