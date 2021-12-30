import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: false as const,

	kind: 'read:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Clip',
	},
};

export default define(meta, async (ps, me) => {
	// Fetch the clip
	const clip = await Clips.findOne({
		id: ps.clipId,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	return await Clips.pack(clip);
});
