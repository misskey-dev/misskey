/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],
	requireCredential: true,
	kind: 'write:account',
	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		statusEmoji: { type: 'string', maxLength: 64, nullable: true },
		statusText: { type: 'string', maxLength: 150, nullable: true },
		statusExpiresAt: { type: 'string', format: 'date-time', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.usersRepository.update(me.id, {
				statusEmoji: ps.statusEmoji ?? null,
				statusText: ps.statusText ?? null,
				statusExpiresAt: ps.statusExpiresAt ? new Date(ps.statusExpiresAt) : null,
			});
		});
	}
}
