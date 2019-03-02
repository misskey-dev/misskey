import $ from 'cafy';
import define from '../../define';
import Log from '../../../../models/log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
		},

		level: {
			validator: $.optional.nullable.str,
			default: null as any
		},

		domain: {
			validator: $.optional.nullable.str,
			default: null as any
		}
	}
};

export default define(meta, async (ps) => {
	const sort = {
		_id: -1
	};
	const query = {} as any;

	if (ps.level) query.level = ps.level;
	if (ps.domain) {
		let i = 0;
		for (const d of ps.domain.split(' ')) {
			query[`domain.${i}`] = d;
			i++;
		}
	}

	const logs = await Log
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return logs;
});
