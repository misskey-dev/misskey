import $ from 'cafy';
import define from '../../define';
import Instance from '../../../../models/instance';

export const meta = {
	requireCredential: false,

	params: {
		blocked: {
			validator: $.bool.optional.nullable,
		},

		notResponding: {
			validator: $.bool.optional.nullable,
		},

		markedAsClosed: {
			validator: $.bool.optional.nullable,
		},

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

	res(instances);
}));
