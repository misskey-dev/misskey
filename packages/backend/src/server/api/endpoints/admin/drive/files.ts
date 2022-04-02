import define from '../../../define.js';
import { DriveFiles } from '@/models/index.js';
import { makePaginationQuery } from '../../../common/make-pagination-query.js';

export const meta = {
	tags: ['admin'],

	requireCredential: false,
	requireModerator: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		type: { type: 'string', nullable: true, pattern: /^[a-zA-Z0-9\/\-*]+$/.toString().slice(1, -1) },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: "local" },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = makePaginationQuery(DriveFiles.createQueryBuilder('file'), ps.sinceId, ps.untilId);

	if (ps.origin === 'local') {
		query.andWhere('file.userHost IS NULL');
	} else if (ps.origin === 'remote') {
		query.andWhere('file.userHost IS NOT NULL');
	}

	if (ps.hostname) {
		query.andWhere('file.userHost = :hostname', { hostname: ps.hostname });
	}

	if (ps.type) {
		if (ps.type.endsWith('/*')) {
			query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
		} else {
			query.andWhere('file.type = :type', { type: ps.type });
		}
	}

	const files = await query.take(ps.limit).getMany();

	return await DriveFiles.packMany(files, { detail: true, withUser: true, self: true });
});
