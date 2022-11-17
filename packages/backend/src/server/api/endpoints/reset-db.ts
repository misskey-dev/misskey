import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { resetDb } from '@/misc/reset-db.js';
import { ApiError } from '../error.js';

export const meta = {
	tags: ['non-productive'],

	requireCredential: false,

	description: 'Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.',

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

			await redisClient.flushdb();
			await resetDb(this.db);

			await new Promise(resolve => setTimeout(resolve, 1000));
		});
	}
}
