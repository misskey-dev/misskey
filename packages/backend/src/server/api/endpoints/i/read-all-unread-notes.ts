import { Inject, Injectable } from '@nestjs/common';
import { publishMainStream } from '@/services/stream.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteUnreads } from '@/models/index.js';

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
	) {
		super(meta, paramDef, async (ps, me) => {
			// Remove documents
			await NoteUnreads.delete({
				userId: me.id,
			});

			// 全て既読になったイベントを発行
			publishMainStream(me.id, 'readAllUnreadMentions');
			publishMainStream(me.id, 'readAllUnreadSpecifiedNotes');
		});
	}
}
