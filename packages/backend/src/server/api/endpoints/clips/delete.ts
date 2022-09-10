import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Clips } from '@/models/index.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '70ca08ba-6865-4630-b6fb-8494759aa754',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
	},
	required: ['clipId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const clip = await Clips.findOneBy({
				id: ps.clipId,
				userId: user.id,
			});

			if (clip == null) {
				throw new ApiError(meta.errors.noSuchClip);
			}

			await Clips.delete(clip.id);
		});
	}
}
