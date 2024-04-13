import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserPendingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:account',

	res: {
		type: 'array',
		nullable: false, optional: false,
		items: {
			type: 'object',
			nullable: false, optional: false,
			properties: {
				id: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					nullable: false, optional: false,
					format: 'date-time',
				},
				code: {
					type: 'string',
					nullable: false, optional: false,
				},
				username: {
					type: 'string',
					nullable: false, optional: false,
					example: 'ai',
				},
				email: {
					type: 'string',
					nullable: true, optional: true,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+createdAt', '-createdAt'] },
		username: { type: 'string', nullable: true, default: null },
		email: { type: 'string', nullable: true, default: null },
		code: { type: 'string', nullable: true, default: null },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: UserPendingsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.userPendingsRepository.createQueryBuilder('pending');

			if (ps.username != null) {
				query.andWhere('pending.username = :username', { username: ps.username });
			}

			if (ps.email != null) {
				query.andWhere('pending.email = :email', { email: ps.email });
			}

			if (ps.code != null) {
				query.andWhere('pending.code = :code', { code: ps.code });
			}

			switch (ps.sort) {
				case '+createdAt': query.orderBy('pending.id', 'DESC'); break;
				case '-createdAt': query.orderBy('pending.id', 'ASC'); break;
				default: query.orderBy('pending.id', 'DESC'); break;
			}

			query.limit(ps.limit);
			query.offset(ps.offset);

			const pendings = await query.getMany();
			return pendings.map(pending => ({
				id: pending.id,
				createdAt: pending.createdAt.toISOString(),
				code: pending.code,
				username: pending.username,
				email: pending.email,
			}));
		});
	}
}
