import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { DriveFiles } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		type: {
			validator: $.optional.str.match(/^[a-zA-Z\/\-*]+$/)
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'DriveFile',
		}
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(DriveFiles.createQueryBuilder('file'), ps.sinceId, ps.untilId)
		.andWhere('file.userId = :userId', { userId: user.id });

	if (ps.type) {
		if (ps.type.endsWith('/*')) {
			query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
		} else {
			query.andWhere('file.type = :type', { type: ps.type });
		}
	}

	const files = await query.take(ps.limit!).getMany();

	return await DriveFiles.packMany(files, { detail: false, self: true });
});
