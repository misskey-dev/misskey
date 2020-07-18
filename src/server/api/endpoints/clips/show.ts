import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '../../../../models';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: true as const,

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
			id: 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20'
		},
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the clip
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: me.id,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	return await Clips.pack(clip);
});
