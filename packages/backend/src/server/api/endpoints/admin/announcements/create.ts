import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Announcements } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			updatedAt: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
			title: {
				type: 'string',
				optional: false, nullable: false,
			},
			text: {
				type: 'string',
				optional: false, nullable: false,
			},
			imageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1 },
		text: { type: 'string', minLength: 1 },
		imageUrl: { type: 'string', nullable: true, minLength: 1 },
	},
	required: ['title', 'text', 'imageUrl'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const announcement = await Announcements.insert({
		id: genId(),
		createdAt: new Date(),
		updatedAt: null,
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
	}).then(x => Announcements.findOneByOrFail(x.identifiers[0]));

	return Object.assign({}, announcement, { createdAt: announcement.createdAt.toISOString(), updatedAt: null });
});
