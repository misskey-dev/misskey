import { log } from './logger';
import { exec } from 'shelljs';

export default function(): void {
	checkDependency('Node.js', 'node -v', x => x.match(/^v(.*)\r?\n$/)[1]);
	checkDependency('npm', 'npm -v', x => x.match(/^(.*)\r?\n$/)[1]);
	checkDependency('MongoDB', 'mongo --version', x => x.match(/^MongoDB shell version: (.*)\r?\n$/)[1]);
	checkDependency('Redis', 'redis-server --version', x => x.match(/v=([0-9\.]*)/)[1]);
}

function checkDependency(serviceName: string, command: string, transform: (x: string) => string): void {
	const code = {
		success: 0,
		notFound: 127
	};
	const x = exec(command, { silent: true }) as any;
	if (x.code === code.success) {
		log('Info', `${serviceName} ${transform(x.stdout)}`, 'Deps');
	} else if (x.code === code.notFound) {
		log('Warn', `Unable to find ${serviceName}`);
	}
}
