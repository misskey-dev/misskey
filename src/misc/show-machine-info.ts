import * as os from 'os';
import * as sysUtils from 'systeminformation';
import Logger from './logger';

export async function showMachineInfo(parentLogger: Logger) {
	const logger = parentLogger.createSubLogger('machine');
	logger.debug(`Hostname: ${os.hostname()}`);
	logger.debug(`Platform: ${process.platform} Arch: ${process.arch}`);
	const mem = await sysUtils.mem();
	const totalmem = (mem.total / 1024 / 1024 / 1024).toFixed(1);
	const availmem = (mem.available / 1024 / 1024 / 1024).toFixed(1);
	logger.debug(`CPU: ${os.cpus().length} core MEM: ${totalmem}GB (available: ${availmem}GB)`);
}
