import $ from 'cafy';
import File, { packMany } from '../../../../../models/drive-file';
import define from '../../../define';
import { fallback } from '../../../../../prelude/symbol';

export const meta = {
	requireCredential: false,
	requireModerator: true,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},

		sort: {
			validator: $.str.optional.or([
				'+createdAt',
				'-createdAt',
				'+size',
				'-size',
			]),
		},

		origin: {
			validator: $.str.optional.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local'
		}
	}
};

const sort: any = { // < https://github.com/Microsoft/TypeScript/issues/1863
	'+createdAt': { uploadDate: -1 },
	'-createdAt': { uploadDate: 1 },
	'+size': { length: -1 },
	'-size': { length: 1 },
	[fallback]: { _id: -1 }
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const q = {
		'metadata.deletedAt': { $exists: false },
	} as any;

	if (ps.origin == 'local') q['metadata._user.host'] = null;
	if (ps.origin == 'remote') q['metadata._user.host'] = { $ne: null };

	const files = await File
		.find(q, {
			limit: ps.limit,
			sort: sort[ps.sort] || sort[fallback],
			skip: ps.offset
		});

	res(await packMany(files, { detail: true, withUser: true, self: true }));
}));
