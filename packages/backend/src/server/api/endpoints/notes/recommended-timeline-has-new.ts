/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['notes'], requireCredential: true, kind: 'read:account',
	errors: { featureDisabled: { message: 'Recommended timeline is disabled.', code: 'FEATURE_DISABLED', id: '871d7f45-09fc-42ab-9060-9fd05d8f38dd' } },
	res: { type: 'object', optional: false, nullable: false, properties: { hasNew: { type: 'boolean', optional: false, nullable: false } } },
} as const;

export const paramDef = { type: 'object', properties: { snapshotId: { type: 'string', minLength: 8, maxLength: 128 }, includeFollowing: { type: 'boolean', default: true } }, required: ['snapshotId'] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(@Inject(DI.meta) private serverSettings: MiMeta, @Inject(DI.redisForTimelines) private redisForTimelines: Redis.Redis, @Inject(DI.redis) private redisClient: Redis.Redis) {
		super(meta, paramDef, async (ps, me) => {
			if (!this.serverSettings.enableRecommendedTimeline) throw new ApiError(meta.errors.featureDisabled);
			const allowedUserIds = this.serverSettings.recommendedTimelineAllowedUserIds ?? [];
			if (allowedUserIds.length > 0 && !allowedUserIds.includes(me.id)) return { hasNew: false };
			const key = `torikago:recommended:v15:snapshot:${me.id}:${ps.snapshotId}:home:version`;
			const [snapshotVersion, currentVersion] = await Promise.all([this.redisClient.get(key), this.redisForTimelines.get('torikago:recommended:version')]);
			return { hasNew: snapshotVersion != null && snapshotVersion !== (currentVersion ?? '0') };
		});
	}
}
