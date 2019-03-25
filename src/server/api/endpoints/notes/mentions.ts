import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import { getFriendIds } from '../../common/get-friends';
import define from '../../define';
import read from '../../../../services/note/read';
import { getHideUserIds } from '../../common/get-hide-users';
import { Notes } from '../../../../models';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { Brackets } from 'typeorm';
import { generateMuteQuery } from '../../common/generate-mute-query';

export const meta = {
	desc: {
		'ja-JP': '自分に言及している投稿の一覧を取得します。',
		'en-US': 'Get mentions of myself.'
	},

	tags: ['notes'],

	requireCredential: true,

	params: {
		following: {
			validator: $.optional.bool,
			default: false
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		visibility: {
			validator: $.optional.str,
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = Notes.createQueryBuilder('note')
		.where(generateVisibilityQuery(user))
		.andWhere(new Brackets(qb => { qb
			.where('note.mentions ANY(:userId1)', { userId1: user.id })
			.orWhere('note.visibleUserIds ANY(:userId2)', { userId2: user.id });
		}));

	query.andWhere(generateMuteQuery(user));

	const sort = {
		id: -1
	};

	if (ps.visibility) {
		query.andWhere('note.visibility = :visibility', { visibility: ps.visibility });
	}

	if (ps.following) {
		const followingIds = await getFriendIds(user.id);
		query.andWhere('note.userId IN (:...followings)', { followings: followingIds });
	}

	if (ps.sinceId) {
		sort.id = 1;
		query.andWhere('note.id > :id', { id: ps.sinceId });
	} else if (ps.untilId) {
		query.andWhere('note.id < :id', { id: ps.untilId });
	}

	const mentions = await Notes.find({
		where: query,
		take: ps.limit,
		order: sort
	});

	for (const note of mentions) {
		read(user.id, note.id);
	}

	return await Notes.packMany(mentions, user);
});
