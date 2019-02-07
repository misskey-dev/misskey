import $ from 'cafy';
import define from '../../define';
import Instance from '../../../../models/instance';

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
			validator: $.str.optional,
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	let sort;

	if (ps.sort) {
		if (ps.sort == '+notes') {
			sort = {
				notesCount: -1
			};
		} else if (ps.sort == '-notes') {
			sort = {
				notesCount: 1
			};
		} else if (ps.sort == '+users') {
			sort = {
				usersCount: -1
			};
		} else if (ps.sort == '-users') {
			sort = {
				usersCount: 1
			};
		} else if (ps.sort == '+following') {
			sort = {
				followingCount: -1
			};
		} else if (ps.sort == '-following') {
			sort = {
				followingCount: 1
			};
		} else if (ps.sort == '+followers') {
			sort = {
				followersCount: -1
			};
		} else if (ps.sort == '-followers') {
			sort = {
				followersCount: 1
			};
		} else if (ps.sort == '+caughtAt') {
			sort = {
				caughtAt: -1
			};
		} else if (ps.sort == '-caughtAt') {
			sort = {
				caughtAt: 1
			};
		}
	} else {
		sort = {
			_id: -1
		};
	}

	const instances = await Instance
		.find({}, {
			limit: ps.limit,
			sort: sort,
			skip: ps.offset
		});

	res(instances);
}));
