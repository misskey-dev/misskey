import Logger from './logger';
import { exec } from 'shelljs';

export default class {
	logger: Logger;

	constructor() {
		this.logger = new Logger('Deps');
	}

	showAll(): void {
		this.show('MongoDB', 'mongo --version', x => x.match(/^MongoDB shell version: (.*)\r?\n$/));
		this.show('Redis', 'redis-server --version', x => x.match(/v=([0-9\.]*)/));
		this.show('GraphicsMagick', 'gm -version', x => x.match(/^GraphicsMagick ([0-9\.]*) .*/));
	}

	show(serviceName: string, command: string, transform: (x: string) => RegExpMatchArray): void {
		const code = {
			success: 0,
			notFound: 127
		};
		const x = exec(command, { silent: true }) as any;
		if (x.code === code.success) {
			let ver = transform(x.stdout);
			if (ver != null) {
				this.logger.info(`${serviceName} ${ver[1]} found`);
			} else {
				this.logger.warn(`${serviceName} not found`);
				this.logger.warn(`Regexp used for version check of ${serviceName} is probably messed up`);
			}
		} else if (x.code === code.notFound) {
			this.logger.warn(`${serviceName} not found`);
		}
	}
}
