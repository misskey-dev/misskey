import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { DriveFolders } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { types, bool } from '../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのフォルダ一覧を取得します。',
		'en-US': 'Get folders of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

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
			default: null,
		}
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
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
