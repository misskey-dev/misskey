import * as os from 'os';
import Logger from './logger';

export default class MachineInfo {
	static show(): void {
		const totalmem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
		const freemem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
		let logger = new Logger('Machine');
		logger.info(os.hostname());
		logger.info(`CPU: ${os.cpus().length}core`);
		logger.info(`MEM: ${totalmem}GB (available: ${freemem}GB)`);
	}
}
