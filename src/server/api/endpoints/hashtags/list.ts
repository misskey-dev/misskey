import $ from 'cafy';
import define from '../../define';
import { Hashtags } from '../../../../models';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false as const,

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
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Hashtag',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = Hashtags.createQueryBuilder('tag');

	if (ps.attachedToUserOnly) query.andWhere('tag.attachedUsersCount != 0');
	if (ps.attachedToLocalUserOnly) query.andWhere('tag.attachedLocalUsersCount != 0');
	if (ps.attachedToRemoteUserOnly) query.andWhere('tag.attachedRemoteUsersCount != 0');

	switch (ps.sort) {
		case '+mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'DESC'); break;
		case '-mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'ASC'); break;
		case '+mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'DESC'); break;
		case '-mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'ASC'); break;
		case '+mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'DESC'); break;
		case '-mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'ASC'); break;
		case '+attachedUsers': query.orderBy('tag.attachedUsersCount', 'DESC'); break;
		case '-attachedUsers': query.orderBy('tag.attachedUsersCount', 'ASC'); break;
		case '+attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'DESC'); break;
		case '-attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'ASC'); break;
		case '+attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'DESC'); break;
		case '-attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'ASC'); break;
	}

	query.select([
		'tag.name',
		'tag.mentionedUsersCount',
		'tag.mentionedLocalUsersCount',
		'tag.mentionedRemoteUsersCount',
		'tag.attachedUsersCount',
		'tag.attachedLocalUsersCount',
		'tag.attachedRemoteUsersCount',
	]);

	const tags = await query.take(ps.limit!).getMany();

	return Hashtags.packMany(tags);
});
