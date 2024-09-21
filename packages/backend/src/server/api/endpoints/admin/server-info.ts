/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import si from 'systeminformation';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:server-info',

	tags: ['admin', 'meta'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			machine: {
				type: 'string',
				optional: false, nullable: false,
			},
			os: {
				type: 'string',
				optional: false, nullable: false,
				example: 'linux',
			},
			node: {
				type: 'string',
				optional: false, nullable: false,
			},
			psql: {
				type: 'string',
				optional: false, nullable: false,
			},
			cpu: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					model: {
						type: 'string',
						optional: false, nullable: false,
					},
					cores: {
						type: 'number',
						optional: false, nullable: false,
					},
				},
			},
			mem: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					total: {
						type: 'number',
						optional: false, nullable: false,
						format: 'bytes',
					},
				},
			},
			fs: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					total: {
						type: 'number',
						optional: false, nullable: false,
						format: 'bytes',
					},
					used: {
						type: 'number',
						optional: false, nullable: false,
						format: 'bytes',
					},
				},
			},
			net: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					interface: {
						type: 'string',
						optional: false, nullable: false,
						example: 'eth0',
					},
				},
			},
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

	) {
		super(meta, paramDef, async () => {
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
