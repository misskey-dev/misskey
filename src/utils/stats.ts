import * as os from 'os';
const osUtils = require('os-utils');
import * as diskusage from 'diskusage';
import Xev from 'xev';

const ev = new Xev();

/**
 * Report stats regularly
 */
export default function() {
	setInterval(() => {
		osUtils.cpuUsage(cpuUsage => {
			const disk = diskusage.checkSync(os.platform() == 'win32' ? 'c:' : '/');
			ev.emit('stats', {
				cpu_usage: cpuUsage,
				mem: {
					total: os.totalmem(),
					free: os.freemem()
				},
				disk,
				os_uptime: os.uptime(),
				process_uptime: process.uptime()
			});
		});
	}, 1000);
}
