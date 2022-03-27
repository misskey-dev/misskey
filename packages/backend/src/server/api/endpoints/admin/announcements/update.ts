import define from '../../../define.js';
import { Announcements } from '@/models/index.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1 },
		text: { type: 'string', minLength: 1 },
		imageUrl: { type: 'string', nullable: true, minLength: 1 },
	},
	required: ['id', 'title', 'text', 'imageUrl'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const announcement = await Announcements.findOneBy({ id: ps.id });

	if (announcement == null) throw new ApiError(meta.errors.noSuchAnnouncement);

	await Announcements.update(announcement.id, {
		updatedAt: new Date(),
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
	});
});
