import $ from 'cafy';
import File, { packMany } from '../../../../../models/drive-file';
import define from '../../../define';

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

const sort = (sort: string) => {
	switch (sort) {
		case '+createdAt': return { uploadDate: -1 };
		case '-createdAt': return { uploadDate: 1 };
		case '+size': return { length: -1 };
		case '-size': return { length: 1 };
		default: return { _id: -1 };
	}
};

export default define(meta, ps => File.find({
		'metadata.deletedAt': { $exists: false },
		'metadata._user.host':
			origin === 'local' ? null :
			origin === 'remote' ? { $ne: null } : undefined as any
	}, {
		limit: ps.limit,
		sort: sort(ps.sort),
		skip: ps.offset
	})
	.then(x => packMany(x, {
		detail: true,
		withUser: true
	})));
