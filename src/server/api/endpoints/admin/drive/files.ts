import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '../../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': '管理用のドライブの一覧を表示します。',
		'en-US': 'Displays a list of management drives.'
	},

	tags: ['admin'],

	requireCredential: false as const,
	requireModerator: true,

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
			validator: $.optional.nullable.str.match(/^[a-zA-Z\/\-*]+$/)
		},

		origin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local'
		},

		hostname: {
			validator: $.optional.nullable.str,
			default: null
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'DriveFile'
		}
	}
};

export default define(meta, async (ps, me) => {
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

	const files = await query.take(ps.limit!).getMany();

	return await DriveFiles.packMany(files, { detail: true, withUser: true, self: true });
});
