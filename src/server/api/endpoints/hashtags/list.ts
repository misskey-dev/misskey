import $ from 'cafy';
import define from '../../define';
import { Hashtags } from '../../../../models';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		attachedToUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		attachedToLocalUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		attachedToRemoteUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		sort: {
			validator: $.str.or([
				'+mentionedUsers',
				'-mentionedUsers',
				'+mentionedLocalUsers',
				'-mentionedLocalUsers',
				'+mentionedRemoteUsers',
				'-mentionedRemoteUsers',
				'+attachedUsers',
				'-attachedUsers',
				'+attachedLocalUsers',
				'-attachedLocalUsers',
				'+attachedRemoteUsers',
				'-attachedRemoteUsers',
			]),
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Hashtag'
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = Hashtags.createQueryBuilder('tag');

	if (ps.attachedToUserOnly) query.andWhere('tags.attachedUsersCount != 0');
	if (ps.attachedToLocalUserOnly) query.andWhere('tags.attachedLocalUsersCount != 0');
	if (ps.attachedToRemoteUserOnly) query.andWhere('tags.attachedRemoteUsersCount != 0');

	switch (ps.sort) {
		case '+mentionedUsers': query.orderBy('tags.mentionedUsersCount', 'DESC'); break;
		case '-mentionedUsers': query.orderBy('tags.mentionedUsersCount', 'ASC'); break;
		case '+mentionedLocalUsers': query.orderBy('tags.mentionedLocalUsersCount', 'DESC'); break;
		case '-mentionedLocalUsers': query.orderBy('tags.mentionedLocalUsersCount', 'ASC'); break;
		case '+mentionedRemoteUsers': query.orderBy('tags.mentionedRemoteUsersCount', 'DESC'); break;
		case '-mentionedRemoteUsers': query.orderBy('tags.mentionedRemoteUsersCount', 'ASC'); break;
		case '+attachedUsers': query.orderBy('tags.attachedUsersCount', 'DESC'); break;
		case '-attachedUsers': query.orderBy('tags.attachedUsersCount', 'ASC'); break;
		case '+attachedLocalUsers': query.orderBy('tags.attachedLocalUsersCount', 'DESC'); break;
		case '-attachedLocalUsers': query.orderBy('tags.attachedLocalUsersCount', 'ASC'); break;
		case '+attachedRemoteUsers': query.orderBy('tags.attachedRemoteUsersCount', 'DESC'); break;
		case '-attachedRemoteUsers': query.orderBy('tags.attachedRemoteUsersCount', 'ASC'); break;
	}

	query.select([
		'tags.name',
		'tags.mentionedUsersCount',
		'tags.mentionedLocalUsersCount',
		'tags.mentionedRemoteUsersCount',
		'tags.attachedUsersCount',
		'tags.attachedLocalUsersCount',
		'tags.attachedRemoteUsersCount',
	]);

	const tags = await query.take(ps.limit).getMany();

	return tags;
});
