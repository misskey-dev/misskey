import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '../../../../models';

export const meta = {
	tags: ['clips'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},

		name: {
			validator: $.str.range(1, 100),
		},

		isPublic: {
			validator: $.optional.bool
		},

		description: {
			validator: $.optional.nullable.str.range(1, 2048)
		}
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b4d92d70-b216-46fa-9a3f-a8c811699257'
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Clip'
	}
};

export default define(meta, async (ps, user) => {
	// Fetch the clip
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	await Clips.update(clip.id, {
		name: ps.name,
		description: ps.description,
		isPublic: ps.isPublic,
	});

	return await Clips.pack(clip.id);
});
