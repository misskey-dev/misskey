import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import type { UserAccountMoveLogRepository } from '@/models/_.js';
import { UserAccountMoveLogEntityService } from '@/core/entities/UserAccountMoveLogEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-account-move-log',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				movedToId: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				movedTo: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
				movedFromId: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				movedFrom: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		movedFromId: { type: 'string', format: 'misskey:id', nullable: true },
		movedToId: { type: 'string', format: 'misskey:id', nullable: true },
		from: { type: 'string', enum: ['local', 'remote', 'all'], nullable: true },
		to: { type: 'string', enum: ['local', 'remote', 'all'], nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userAccountMoveLogRepository)
		private userAccountMoveLogRepository: UserAccountMoveLogRepository,

		private userAccountMoveLogEntityService: UserAccountMoveLogEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.userAccountMoveLogRepository.createQueryBuilder('accountMoveLogs'), ps.sinceId, ps.untilId);

			if (ps.movedFromId != null) {
				query.andWhere('accountMoveLogs.movedFromId = :movedFromId', { movedFromId: ps.movedFromId });
			}

			if (ps.movedToId != null) {
				query.andWhere('accountMoveLogs.movedToId = :movedToId', { movedToId: ps.movedToId });
			}

			if (ps.from != null || ps.to != null) {
				query
					.innerJoin('accountMoveLogs.movedFrom', 'movedFrom')
					.innerJoin('accountMoveLogs.movedTo', 'movedTo');

				if (ps.from === 'local') {
					query.andWhere('movedFrom.host IS NULL');
				}

				if (ps.from === 'remote') {
					query.andWhere('movedFrom.host IS NOT NULL');
				}

				if (ps.to === 'local') {
					query.andWhere('movedTo.host IS NULL');
				}

				if (ps.to === 'remote') {
					query.andWhere('movedTo.host IS NOT NULL');
				}
			}

			const accountMoveLogs = await query.limit(ps.limit).getMany();

			return await this.userAccountMoveLogEntityService.packMany(accountMoveLogs, me);
		});
	}
}
