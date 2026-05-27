/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { WorldAvatarEntityService } from '@/core/entities/WorldAvatarEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['worldAvatar'],

	requireCredential: true,

	kind: 'read:worldAvatar',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'WorldAvatarLite',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldAvatarEntityService: WorldAvatarEntityService,
		private worldAvatarService: WorldAvatarService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const avatars = await this.worldAvatarService.getMyAvatarsWithPagination(ps.userId, ps.limit, sinceId, untilId);
			return this.worldAvatarEntityService.packLiteMany(avatars, me);
		});
	}
}
