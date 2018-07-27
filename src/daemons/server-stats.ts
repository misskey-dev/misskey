import * as os from 'os';
import * as sysUtils from 'systeminformation';
import * as diskusage from 'diskusage';
import Xev from 'xev';

const ev = new Xev();

const interval = 1000;

/**
 * Report server stats regularly
 */
export default function() {
	const log: any[] = [];

	ev.on('requestServerStatsLog', id => {
		ev.emit('serverStatsLog:' + id, log);
	});

	async function tick() {
		const cpu = await cpuUsage();
		const usedmem = await usedMem();
		const totalmem = await totalMem();
		const disk = diskusage.checkSync(os.platform() == 'win32' ? 'c:' : '/');

		const stats = {
			cpu_usage: cpu,
			mem: {
				total: totalmem,
				used: usedmem
			},
			disk,
			os_uptime: os.uptime(),
			process_uptime: process.uptime()
		};
		ev.emit('serverStats', stats);
		log.push(stats);
		if (log.length > 50) log.shift();
	}

	tick();

	setInterval(tick, interval);
}

// CPU STAT
async function cpuUsage() {
	try {
		const data = await sysUtils.currentLoad();
		return Math.floor(data.currentload / 100);
	} catch (error) {
		console.error(error);
		throw error;
	}
}

// MEMORY(excl buffer + cache) STAT
async function usedMem() {
	try {
		const data = await sysUtils.mem();
		return data.active;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

// TOTAL MEMORY STAT
async function totalMem() {
	try {
		const data = await sysUtils.mem();
		return data.total;
	} catch (error) {
		console.error(error);
		throw error;
	}
}
