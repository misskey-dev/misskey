import * as os from 'node:os';
import si from 'systeminformation';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/server-info'> {
	name = 'admin/server-info' as const;
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

	) {
		super(async () => {
			const memStats = await si.mem();
			const fsStats = await si.fsSize();
			const netInterface = await si.networkInterfaceDefault();

			const redisServerInfo = await this.redisClient.info('Server');
			const m = redisServerInfo.match(new RegExp('^redis_version:(.*)', 'm'));
			const redis_version = m?.[1];

			return {
				machine: os.hostname(),
				os: os.platform(),
				node: process.version,
				psql: await this.db.query('SHOW server_version').then(x => x[0].server_version),
				redis: redis_version,
				cpu: {
					model: os.cpus()[0].model,
					cores: os.cpus().length,
				},
				mem: {
					total: memStats.total,
				},
				fs: {
					total: fsStats[0].size,
					used: fsStats[0].used,
				},
				net: {
					interface: netInterface,
				},
			};
		});
	}
}
