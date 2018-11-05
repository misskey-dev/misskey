import * as os from 'os';
import Logger from './logger';
import * as sysUtils from 'systeminformation';

export default class {
	public static async show() {
		const logger = new Logger('Machine');
		logger.info(`Hostname: ${os.hostname()}`);
		logger.info(`Platform: ${process.platform}`);
		logger.info(`Architecture: ${process.arch}`);
		logger.info(`CPU: ${os.cpus().length} core`);
		const mem = await sysUtils.mem();
		const totalmem = (mem.total / 1024 / 1024 / 1024).toFixed(1);
		const availmem = (mem.available / 1024 / 1024 / 1024).toFixed(1);
		logger.info(`MEM: ${totalmem}GB (available: ${availmem}GB)`);
	}
}
