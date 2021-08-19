import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import read from '@/services/note/read.js';
import { Notes, Followings } from '@/models/index.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { Brackets } from 'typeorm';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

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
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},
};

export default define(meta, async (ps, user) => {
	const followingQuery = Followings.createQueryBuilder('following')
		.select('following.followeeId')
		.where('following.followerId = :followerId', { followerId: user.id });

	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(new Brackets(qb => { qb
			.where(`'{"${user.id}"}' <@ note.mentions`)
			.orWhere(`'{"${user.id}"}' <@ note.visibleUserIds`);
		}))
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateVisibilityQuery(query, user);
	generateMutedUserQuery(query, user);
	generateBlockedUserQuery(query, user);

	if (ps.visibility) {
		query.andWhere('note.visibility = :visibility', { visibility: ps.visibility });
	}

	if (ps.following) {
		query.andWhere(`((note.userId IN (${ followingQuery.getQuery() })) OR (note.userId = :meId))`, { meId: user.id });
		query.setParameters(followingQuery.getParameters());
	}

	const mentions = await query.take(ps.limit!).getMany();

	read(user.id, mentions);

	return await Notes.packMany(mentions, user);
});
