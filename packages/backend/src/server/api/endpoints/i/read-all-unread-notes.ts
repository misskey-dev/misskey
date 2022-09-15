import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteUnreads } from '@/models/index.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',
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
		@Inject('noteUnreadsJoinings')
		private noteUnreadsJoinings: typeof NoteUnreads,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Remove documents
			await this.noteUnreadsJoinings.delete({
				userId: me.id,
			});

			// 全て既読になったイベントを発行
			this.globalEventService.publishMainStream(me.id, 'readAllUnreadMentions');
			this.globalEventService.publishMainStream(me.id, 'readAllUnreadSpecifiedNotes');
		});
	}
}
