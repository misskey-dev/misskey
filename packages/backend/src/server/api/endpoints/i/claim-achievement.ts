/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AchievementService, ACHIEVEMENT_TYPES } from '@/core/AchievementService.js';

export const meta = {
	requireCredential: true,
	prohibitMoved: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', enum: ACHIEVEMENT_TYPES },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private achievementService: AchievementService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.achievementService.create(me.id, ps.name);
		});
	}
}
