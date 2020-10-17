import * as os from 'os';
import * as si from 'systeminformation';
import { getConnection } from 'typeorm';
import define from '../../define';
import redis from '../../../../db/redis';

export const meta = {
	requireCredential: true as const,
	requireAdmin: true,
	requireModerator: true,

	desc: {
	},

	tags: ['admin', 'meta'],

	params: {
	},
};

export default define(meta, async () => {
	const memStats = await si.mem();
	const fsStats = await si.fsSize();
	const netInterface = await si.networkInterfaceDefault();

	return {
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		psql: await getConnection().query('SHOW server_version').then(x => x[0].server_version),
		redis: redis.server_info.redis_version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		mem: {
			total: memStats.total
		},
		fs: {
			total: fsStats[0].size,
			used: fsStats[0].used,
		},
		net: {
			interface: netInterface
		}
	};
});
