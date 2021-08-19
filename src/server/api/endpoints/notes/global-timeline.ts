import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { ApiError } from '../../error.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { Notes } from '@/models/index.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { activeUsersChart } from '@/services/chart/index.js';
import { generateRepliesQuery } from '../../common/generate-replies-query.js';
import { generateMutedNoteQuery } from '../../common/generate-muted-note-query.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes'],

	params: {
		withFiles: {
			validator: $.optional.bool,
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

		sinceDate: {
			validator: $.optional.num
		},

		untilDate: {
			validator: $.optional.num
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

	errors: {
		gtlDisabled: {
			message: 'Global timeline has been disabled.',
			code: 'GTL_DISABLED',
			id: '0332fc13-6ab2-4427-ae80-a9fadffd1a6b'
		},
	}
};

export default define(meta, async (ps, user) => {
	const m = await fetchMeta();
	if (m.disableGlobalTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError(meta.errors.gtlDisabled);
		}
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('note.visibility = \'public\'')
		.andWhere('note.channelId IS NULL')
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateRepliesQuery(query, user);
	if (user) generateMutedUserQuery(query, user);
	if (user) generateMutedNoteQuery(query, user);
	if (user) generateBlockedUserQuery(query, user);

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}
	//#endregion

	const timeline = await query.take(ps.limit!).getMany();

	process.nextTick(() => {
		if (user) {
			activeUsersChart.update(user);
		}
	});

	return await Notes.packMany(timeline, user);
});
