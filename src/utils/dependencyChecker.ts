import Logger from './logger';
import { exec } from 'shelljs';

export default class DependencyChecker {
	logger: Logger;

	constructor() {
		this.logger = new Logger('Deps');
	}

	checkAll(): void {
		this.logger.info('Checking started');
		this.check('Node.js', 'node -v', x => x.match(/^v(.*)\r?\n$/));
		this.check('npm', 'npm -v', x => x.match(/^(.*)\r?\n$/));
		this.check('MongoDB', 'mongo --version', x => x.match(/^MongoDB shell version: (.*)\r?\n$/));
		this.check('Redis', 'redis-server --version', x => x.match(/v=([0-9\.]*)/));
		this.logger.info('Checking finished');
	}

	check(serviceName: string, command: string, transform: (x: string) => RegExpMatchArray): void {
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
