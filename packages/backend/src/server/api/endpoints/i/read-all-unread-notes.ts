/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteUnreadsRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteUnreadsRepository)
		private noteUnreadsRepository: NoteUnreadsRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Remove documents
			await this.noteUnreadsRepository.delete({
				userId: me.id,
			});

			// 全て既読になったイベントを発行
			this.globalEventService.publishMainStream(me.id, 'readAllUnreadMentions');
			this.globalEventService.publishMainStream(me.id, 'readAllUnreadSpecifiedNotes');
		});
	}
}
