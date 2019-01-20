import $ from 'cafy';
import File, { packMany } from '../../../../../models/drive-file';
import define from '../../../define';
import { query } from '../../../../../prelude/query';

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

const mika: { [x: string]: any } = {
	'+createdAt': { uploadDate: -1 },
	'-createdAt': { uploadDate: 1 },
	'+size': { length: -1 },
	'-size': { length: 1 }
};

const rika = { _id: -1 };

export default define(meta, ps => File.find(query({
		'metadata.deletedAt': { $exists: false },
		'metadata._user.host':
			origin === 'local' ? null :
			origin === 'remote' ? { $ne: null } : undefined as any
	}), {
		limit: ps.limit,
		sort: mika[ps.sort] || rika,
		skip: ps.offset
	})
	.then(x => packMany(x, {
		detail: true,
		withUser: true,
		self: true
	})));
