import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { DriveFiles } from '../../../../models';
import { generatePaginationQuery } from '../../common/generate-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイル一覧を取得します。',
		'en-US': 'Get files of drive.'
	},

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

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null as any,
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

	if (ps.folderId) {
		query.andWhere('file.folderId = :folderId', { folderId: ps.folderId });
	} else {
		query.andWhere('file.folderId IS NULL');
	}

	if (ps.type) {
		// v11 TODO
		query.type = new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`);
	}

	const files = await query.getMany();

	return await DriveFiles.packMany(files, { detail: false, self: true });
});
