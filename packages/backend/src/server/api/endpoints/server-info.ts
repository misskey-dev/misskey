/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import si from 'systeminformation';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { MetaService } from '@/core/MetaService.js';

export const meta = {
	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	tags: ['meta'],
	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			machine: {
				type: 'string',
				nullable: false,
			},
			cpu: {
				type: 'object',
				nullable: false,
				properties: {
					model: {
						type: 'string',
						nullable: false,
					},
					cores: {
						type: 'number',
						nullable: false,
					},
				},
			},
			mem: {
				type: 'object',
				properties: {
					total: {
						type: 'number',
						nullable: false,
					},
				},
			},
			fs: {
				type: 'object',
				nullable: false,
				properties: {
					total: {
						type: 'number',
						nullable: false,
					},
					used: {
						type: 'number',
						nullable: false,
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
		private metaService: MetaService,
	) {
		super(meta, paramDef, async () => {
			if (!(await this.metaService.fetch()).enableServerMachineStats) return {
				machine: '?',
				cpu: {
					model: '?',
					cores: 0,
				},
				mem: {
					total: 0,
				},
				fs: {
					total: 0,
					used: 0,
				},
			};

			const memStats = await si.mem();
			const fsStats = await si.fsSize();

			return {
				machine: os.hostname(),
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
			};
		});
	}
}
