import Logger from './logger';
import { execSync } from 'child_process';

export default class {
	private logger: Logger;

	constructor() {
		this.logger = new Logger('Deps');
	}

	public showAll(): void {
		this.show('MongoDB', 'mongo --version', x => x.match(/^MongoDB shell version:? (.*)\r?\n/));
		this.show('Redis', 'redis-server --version', x => x.match(/v=([0-9\.]*)/));
		this.show('ImageMagick', 'magick -version', x => x.match(/^Version: ImageMagick (.+?)\r?\n/));
	}

	public show(serviceName: string, command: string, transform: (x: string) => RegExpMatchArray): void {
		try {
			// ステータス0以外のときにexecSyncはstderrをコンソール上に出力してしまうので
			// プロセスからのstderrをすべて無視するように stdio オプションをセット
			const x = execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] });
			const ver = transform(x.toString());
			if (ver != null) {
				this.logger.info(`${serviceName} ${ver[1]} found`);
			} else {
				this.logger.warn(`${serviceName} not found`);
				this.logger.warn(`Regexp used for version check of ${serviceName} is probably messed up`);
			}
		} catch (e) {
			this.logger.warn(`${serviceName} not found`);
		}
	}
}
