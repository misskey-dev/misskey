import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Clips } from '@/models/index.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

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

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 100 },
		isPublic: { type: 'boolean' },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
	},
	required: ['clipId', 'name'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch the clip
	const clip = await Clips.findOneBy({
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
