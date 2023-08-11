import * as os from 'node:os';
import sysUtils from 'systeminformation';
import type Logger from '@/logger.js';

export async function showMachineInfo(parentLogger: Logger) {
	const logger = parentLogger.createSubLogger('machine');
	logger.debug(`Hostname: ${os.hostname()}`);
	logger.debug(`Platform: ${process.platform} Arch: ${process.arch}`);
	const mem = await sysUtils.mem();
	const totalmem = (mem.total / 1024 / 1024 / 1024).toFixed(1);
	const availmem = (mem.available / 1024 / 1024 / 1024).toFixed(1);
	logger.debug(`CPU: ${os.cpus().length} core MEM: ${totalmem}GB (available: ${availmem}GB)`);
}
