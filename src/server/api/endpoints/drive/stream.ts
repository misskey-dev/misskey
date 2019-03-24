import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import DriveFile, { packMany } from '../../../../models/entities/drive-file';
import define from '../../define';

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
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
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
		'metadata.deletedAt': { $exists: false }
	} as any;

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	if (ps.type) {
		query.contentType = new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`);
	}

	const files = await DriveFile
		.find(query, {
			take: ps.limit,
			order: sort
		});

		return await packMany(files, { self: true });
});
