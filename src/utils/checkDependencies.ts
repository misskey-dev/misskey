import Logger from './logger';
import { exec } from 'shelljs';

export default function(): void {
	checkDependency('Node.js', 'node -v', x => x.match(/^v(.*)\r?\n$/));
	checkDependency('npm', 'npm -v', x => x.match(/^(.*)\r?\n$/));
	checkDependency('MongoDB', 'mongo --version', x => x.match(/^MongoDB shell version: (.*)\r?\n$/));
	checkDependency('Redis', 'redis-server --version', x => x.match(/v=([0-9\.]*)/));
}

function checkDependency(serviceName: string, command: string, transform: (x: string) => RegExpMatchArray): void {
	const code = {
		success: 0,
		notFound: 127
	};
	let depsLogger = new Logger('Deps');
	const x = exec(command, { silent: true }) as any;
	if (x.code === code.success) {
		let ver = transform(x.stdout);
		if (ver != null) {
			depsLogger.info(`${serviceName} ${ver[1]} found`);
		} else {
			depsLogger.warn(`${serviceName} not found`);
			depsLogger.warn(`Regexp used for version check of ${serviceName} is probably messed up`);
		}
	} else if (x.code === code.notFound) {
		depsLogger.warn(`${serviceName} not found`);
	}
}
