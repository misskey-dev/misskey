import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { DriveFolders } from '../../../../models';
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

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null as any,
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'DriveFolder',
		}
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(DriveFolders.createQueryBuilder('folder'), ps.sinceId, ps.untilId)
		.andWhere('folder.userId = :userId', { userId: user.id });

	if (ps.folderId) {
		query.andWhere('folder.parentId = :parentId', { parentId: ps.folderId });
	} else {
		query.andWhere('folder.parentId IS NULL');
	}

	const folders = await query.take(ps.limit!).getMany();

	return await Promise.all(folders.map(folder => DriveFolders.pack(folder)));
});
