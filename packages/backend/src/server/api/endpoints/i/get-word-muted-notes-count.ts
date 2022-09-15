import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MutedNotes } from '@/models/index.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			count: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('mutedNotesRepository')
		private mutedNotesRepository: typeof MutedNotes,
	) {
		super(meta, paramDef, async (ps, me) => {
			return {
				count: await this.mutedNotesRepository.countBy({
					userId: me.id,
					reason: 'word',
				}),
			};
		});
	}
}
