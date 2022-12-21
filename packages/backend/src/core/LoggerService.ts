import { Inject, Injectable } from '@nestjs/common';
import * as SyslogPro from 'syslog-pro';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import type { KEYWORD } from 'color-convert/conversions';

@Injectable()
export class LoggerService {
	private syslogClient;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		if (this.config.syslog) {
			this.syslogClient = new SyslogPro.RFC5424({
				applicationName: 'Misskey',
				timestamp: true,
				includeStructuredData: true,
				color: true,
				extendedColor: true,
				server: {
					target: config.syslog.host,
					port: config.syslog.port,
				},
			});
		}
	}

	@bindThis
	public getLogger(domain: string, color?: KEYWORD | undefined, store?: boolean) {
		return new Logger(domain, color, store, this.syslogClient);
	}
}
