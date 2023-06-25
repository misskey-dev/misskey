import ms from 'ms';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ReactionService } from '@/core/ReactionService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['reactions', 'notes'],

	requireCredential: true,

	kind: 'write:reactions',

	limit: {
		duration: ms('1hour'),
		max: 60,
		minInterval: ms('3sec'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37',
		},

		notReacted: {
			message: 'You are not reacting to that note.',
			code: 'NOT_REACTED',
			id: '92f4426d-4196-4125-aa5b-02943e2ec8fc',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private getterService: GetterService,
		private reactionService: ReactionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});
			await this.reactionService.delete(me, note).catch(err => {
				if (err.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') throw new ApiError(meta.errors.notReacted);
				throw err;
			});
		});
	}
}
