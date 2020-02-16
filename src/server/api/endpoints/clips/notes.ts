import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Clips, Notes } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMuteQuery } from '../../common/generate-mute-query';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true as const,

	kind: 'read:account',

	params: {
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
	},

	errors: {
		noSuchClip: {
			message: 'No such list.',
			code: 'NO_SUCH_CLIP',
			id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00'
		}
	}
};

export default define(meta, async (ps, user) => {
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	const clipQuery = ClipNotes.createQueryBuilder('joining')
		.select('joining.noteId')
		.where('joining.clipId = :clipId', { clipId: clip.id });

	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(`note.id IN (${ clipQuery.getQuery() })`)
		.leftJoinAndSelect('note.user', 'user')
		.setParameters(clipQuery.getParameters());

	generateVisibilityQuery(query, user);
	generateMuteQuery(query, user);

	const notes = await query
		.take(ps.limit!)
		.getMany();

	return await Notes.packMany(notes, user);
});
