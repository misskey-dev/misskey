import $ from 'cafy';
import File, { packMany } from '../../../../../models/drive-file';
import define from '../../../define';

export const meta = {
	requireCredential: false,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},

		sort: {
			validator: $.optional.str.or([
				'+createdAt',
				'-createdAt',
				'+size',
				'-size',
			]),
		},

		origin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local'
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	let _sort;
	if (ps.sort) {
		if (ps.sort == '+createdAt') {
			_sort = {
				uploadDate: -1
			};
		} else if (ps.sort == '-createdAt') {
			_sort = {
				uploadDate: 1
			};
		} else if (ps.sort == '+size') {
			_sort = {
				length: -1
			};
		} else if (ps.sort == '-size') {
			_sort = {
				length: 1
			};
		}
	} else {
		_sort = {
			_id: -1
		};
	}

	const q = {
		'metadata.deletedAt': { $exists: false },
	} as any;

	if (ps.origin == 'local') q['metadata._user.host'] = null;
	if (ps.origin == 'remote') q['metadata._user.host'] = { $ne: null };

	const files = await File
		.find(q, {
			limit: ps.limit,
			sort: _sort,
			skip: ps.offset
		});

	res(await packMany(files, { detail: true, withUser: true, self: true }));
}));
