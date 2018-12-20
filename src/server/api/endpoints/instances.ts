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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	let _sort;
	if (ps.sort) {
		if (ps.sort == '+notes') {
			_sort = {
				notesCount: -1
			};
		} else if (ps.sort == '-notes') {
			_sort = {
				notesCount: 1
			};
		}
	} else {
		_sort = {
			_id: -1
		};
	}

	const instances = await Instance
		.find({}, {
			limit: ps.limit,
			sort: _sort,
			skip: ps.offset
		});

	res(instances);
}));
