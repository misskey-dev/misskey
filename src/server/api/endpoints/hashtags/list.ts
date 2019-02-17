import $ from 'cafy';
import define from '../../define';
import Hashtag from '../../../../models/hashtag';

export const meta = {
	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sort: {
			validator: $.str.or([
				'+mentionedUsers',
				'-mentionedUsers',
				'+mentionedLocalUsers',
				'-mentionedLocalUsers',
				'+attachedUsers',
				'-attachedUsers',
				'+attachedLocalUsers',
				'-attachedLocalUsers',
			]),
		},
	}
};

const sort: any = {
	'+mentionedUsers': { mentionedUsersCount: -1 },
	'-mentionedUsers': { mentionedUsersCount: 1 },
	'+mentionedLocalUsers': { mentionedLocalUsersCount: -1 },
	'-mentionedLocalUsers': { mentionedLocalUsersCount: 1 },
	'+attachedUsers': { attachedUsersCount: -1 },
	'-attachedUsers': { attachedUsersCount: 1 },
	'+attachedLocalUsers': { attachedLocalUsersCount: -1 },
	'-attachedLocalUsers': { attachedLocalUsersCount: 1 },
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const tags = await Hashtag
		.find({}, {
			limit: ps.limit,
			sort: sort[ps.sort],
			fields: {
				tag: true,
				mentionedUsersCount: true,
				mentionedLocalUsersCount: true,
				attachedUsersCount: true,
				attachedLocalUsersCount: true
			}
		});

	res(tags);
}));
