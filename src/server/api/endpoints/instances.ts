import $ from 'cafy';
import define from '../define';
import Instance from '../../../models/instance';

export const meta = {
	requireCredential: false,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 30
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},

		sort: {
			validator: $.str.optional.or('+notes|-notes'),
		}
	}
};

const mika: { [x: string]: any } = {
	'+notes': { notesCount: -1 },
	'-notes': { notesCount: 1 }
};

const rika = { _id: -1 };

export default define(meta, ps => Instance.find({}, {
		limit: ps.limit,
		sort: mika[ps.sort] || rika,
		skip: ps.offset
	}));
