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
		for (const d of ps.domain.split(' ')) {
			const qs: any[] = [];
			let i = 0;
			for (const sd of (d.startsWith('-') ? d.substr(1) : d).split('.')) {
				qs.push({
					[`domain.${i}`]: d.startsWith('-') ? { $ne: sd } : sd
				});
				i++;
			}
			if (d.startsWith('-')) {
				if (query['$and'] == null) query['$and'] = [];
				query['$and'].push({
					$and: qs
				});
			} else {
				if (query['$or'] == null) query['$or'] = [];
				query['$or'].push({
					$and: qs
				});
			}
		}
	}

	const logs = await Log
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return logs;
});
