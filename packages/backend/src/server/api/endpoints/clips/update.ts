import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		type: 'object',
		properties: {
			clipId: { type: 'string', format: 'misskey:id', },
			name: { type: 'string', minLength: 1, maxLength: 100, },
			isPublic: { type: 'boolean', },
			description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048, },
		},
		required: ['clipId', 'name'],
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Fetch the clip
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id,
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
