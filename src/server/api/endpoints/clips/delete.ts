import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		clipId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '70ca08ba-6865-4630-b6fb-8494759aa754'
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

	await Clips.delete(clip.id);
});
