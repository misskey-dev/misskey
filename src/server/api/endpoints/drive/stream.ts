import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { MoreThan, LessThan } from 'typeorm';
import { DriveFiles } from '../../../../models';

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
	const sort = {
		id: -1
	};

	const query = {
		userId: user.id,
	} as any;

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	if (ps.type) {
		// v11 TODO
		query.contentType = new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`);
	}

	const files = await DriveFiles.find({
		where: query,
		take: ps.limit,
		order: sort
	});

	return await DriveFiles.packMany(files, { self: true });
});
