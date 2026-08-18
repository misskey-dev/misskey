/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ReactionService } from '@/core/ReactionService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['sp-reactions', 'notes'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:reactions',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '92fac1fb-7645-4f25-93a9-84e4a70d7583',
		},

		alreadyReacted: {
			message: 'You are already reacting to that note.',
			code: 'ALREADY_REACTED',
			id: '913b962a-8c22-4efa-b266-4437eea27074',
		},

		youHaveBeenBlocked: {
			message: 'You cannot react this note because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '5087cf55-51c0-4e21-b7a4-9a1a90291a85',
		},

		cannotReactToRenote: {
			message: 'You cannot react to Renote.',
			code: 'CANNOT_REACT_TO_RENOTE',
			id: '938bb658-7d42-4361-b5cc-3eae0e0b8b9b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		reaction: { type: 'string' },
	},
	required: ['noteId', 'reaction'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private getterService: GetterService,
		private reactionService: ReactionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});
			await this.reactionService.createSp(me, note, ps.reaction).catch(err => {
				if (err.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') throw new ApiError(meta.errors.alreadyReacted);
				if (err.id === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') throw new ApiError(meta.errors.youHaveBeenBlocked);
				if (err.id === '12c35529-3c79-4327-b1cc-e2cf63a71925') throw new ApiError(meta.errors.cannotReactToRenote);
				throw err;
			});
			return;
		});
	}
}
