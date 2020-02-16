import $ from 'cafy';
import define from '../../../define';
import { fallback } from '../../../../../prelude/symbol';
import { DriveFiles } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: false as const,
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

const sort: any = { // < https://github.com/Microsoft/TypeScript/issues/1863
	'+createdAt': { createdAt: -1 },
	'-createdAt': { createdAt: 1 },
	'+size': { size: -1 },
	'-size': { size: 1 },
	[fallback]: { id: -1 }
};

export default define(meta, async (ps, me) => {
	const q = {} as any;

	if (ps.origin == 'local') q['userHost'] = null;
	if (ps.origin == 'remote') q['userHost'] = { $ne: null };

	const files = await DriveFiles.find({
		where: q,
		take: ps.limit!,
		order: sort[ps.sort!] || sort[fallback],
		skip: ps.offset
	});

	return await DriveFiles.packMany(files, { detail: true, withUser: true, self: true });
});
