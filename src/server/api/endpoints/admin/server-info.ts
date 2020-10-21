import * as os from 'os';
import * as si from 'systeminformation';
import { getConnection } from 'typeorm';
import define from '../../define';
import redis from '../../../../db/redis';

export const meta = {
	requireCredential: true as const,
	requireAdmin: true,

	desc: {
		'ja-JP': 'サーバー情報を表示します。',
		'en-US': 'Show server information.'
	},

	tags: ['admin', 'meta'],

	params: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			machine: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The name of the running server'
			},
			os: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'OS used by the server',
				example: 'linux'
			},
			node: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Version of Node.js'
			},
			psql: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Version of Postgresql'
			},
			cpu: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					model: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
						description: 'The name of the CPU you are using'
					},
					cores: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						description: 'Number of CPU cores used (number of logical processors)'
					}
				}
			},
			mem: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					total: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						format: 'bytes',
						description: 'RAM capacity.'
					}
				}
			},
			fs: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					total: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						format: 'bytes',
						description: 'Total storage capacity.'
					},
					used: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						format: 'bytes',
						description: 'Amount of storage used'
					}
				}
			},
			net: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					interface: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
						description: 'The interface name of your network.',
						example: 'eth0'
					}
				}
			}
		}
	}
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
