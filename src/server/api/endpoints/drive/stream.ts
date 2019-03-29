import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { DriveFiles } from '../../../../models';
import { generatePaginationQuery } from '../../common/generate-pagination-query';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-read',

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
			validator: $.optional.str.match(/^[a-zA-Z\/\-\*]+$/)
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'DriveFile',
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = generatePaginationQuery(DriveFiles.createQueryBuilder('file'), ps.sinceId, ps.untilId)
		.andWhere('file.userId = :userId', { userId: user.id });

	if (ps.type) {
		if (ps.type.endsWith('/*')) {
			query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
		} else {
			query.andWhere('file.type = :type', { type: ps.type });
		}
	}

	const files = await query.take(ps.limit).getMany();

	return await DriveFiles.packMany(files, { detail: false, self: true });
});
