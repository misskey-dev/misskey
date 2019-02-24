import $ from 'cafy';
import define from '../../define';
import Instance from '../../../../models/instance';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		blocked: {
			validator: $.optional.nullable.bool,
		},

		notResponding: {
			validator: $.optional.nullable.bool,
		},

		markedAsClosed: {
			validator: $.optional.nullable.bool,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},

		sort: {
			validator: $.optional.str,
		}
	}
};

export default define(meta, async (ps, me) => {
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
		} else if (ps.sort == '+lastCommunicatedAt') {
			sort = {
				lastCommunicatedAt: -1
			};
		} else if (ps.sort == '-lastCommunicatedAt') {
			sort = {
				lastCommunicatedAt: 1
			};
		} else if (ps.sort == '+driveUsage') {
			sort = {
				driveUsage: -1
			};
		} else if (ps.sort == '-driveUsage') {
			sort = {
				driveUsage: 1
			};
		} else if (ps.sort == '+driveFiles') {
			sort = {
				driveFiles: -1
			};
		} else if (ps.sort == '-driveFiles') {
			sort = {
				driveFiles: 1
			};
		}
	} else {
		sort = {
			_id: -1
		};
	}

	const q = {} as any;

	if (typeof ps.blocked === 'boolean') q.isBlocked = ps.blocked;
	if (typeof ps.notResponding === 'boolean') q.isNotResponding = ps.notResponding;
	if (typeof ps.markedAsClosed === 'boolean') q.isMarkedAsClosed = ps.markedAsClosed;

	const instances = await Instance
		.find(q, {
			limit: ps.limit,
			sort: sort,
			skip: ps.offset
		});

	return instances;
});
