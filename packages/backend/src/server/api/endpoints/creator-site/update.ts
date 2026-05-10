/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { CreatorSitesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	tags: ['creator-site'],

	requireCredential: true,

	description: 'Update my creator site settings.',

	res: {
		optional: false,
		nullable: false,
		type: 'object',
		properties: {
			id: { type: 'string', optional: false, nullable: false },
			userId: { type: 'string', optional: false, nullable: false },
			title: { type: 'string', optional: false, nullable: true },
			catchphrase: { type: 'string', optional: false, nullable: true },
			commissionStatus: { type: 'string', optional: false, nullable: true },
			collabStatus: { type: 'string', optional: false, nullable: true },
			fanartStatus: { type: 'string', optional: false, nullable: true },
			guidelineUrl: { type: 'string', optional: false, nullable: true },
			guidelineText: { type: 'string', optional: false, nullable: true },
			createdAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
			updatedAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', nullable: true, maxLength: 256 },
		catchphrase: { type: 'string', nullable: true, maxLength: 1024 },
		commissionStatus: { type: 'string', nullable: true, maxLength: 128 },
		collabStatus: { type: 'string', nullable: true, maxLength: 128 },
		fanartStatus: { type: 'string', nullable: true, maxLength: 128 },
		guidelineUrl: { type: 'string', nullable: true, maxLength: 1024 },
		guidelineText: { type: 'string', nullable: true, maxLength: 2048 },
	},
	required: [],
} as const;

function normalize(value: string | null | undefined): string | null {
	if (value == null) return null;

	const trimmed = value.trim();

	return trimmed === '' ? null : trimmed;
}

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject('CreatorSitesRepository')
		private creatorSitesRepository: CreatorSitesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const now = new Date();

			const existing = await this.creatorSitesRepository.findOneBy({
				userId: me.id,
			});

			if (existing == null) {
				const created = await this.creatorSitesRepository.insertOne({
					id: genId(),
					userId: me.id,
					title: normalize(ps.title),
					catchphrase: normalize(ps.catchphrase),
					commissionStatus: normalize(ps.commissionStatus),
					collabStatus: normalize(ps.collabStatus),
					fanartStatus: normalize(ps.fanartStatus),
					guidelineUrl: normalize(ps.guidelineUrl),
					guidelineText: normalize(ps.guidelineText),
					createdAt: now,
					updatedAt: now,
				});

				return {
					id: created.id,
					userId: created.userId,
					title: created.title,
					catchphrase: created.catchphrase,
					commissionStatus: created.commissionStatus,
					collabStatus: created.collabStatus,
					fanartStatus: created.fanartStatus,
					guidelineUrl: created.guidelineUrl,
					guidelineText: created.guidelineText,
					createdAt: created.createdAt.toISOString(),
					updatedAt: created.updatedAt.toISOString(),
				};
			}

			await this.creatorSitesRepository.update(existing.id, {
				title: normalize(ps.title),
				catchphrase: normalize(ps.catchphrase),
				commissionStatus: normalize(ps.commissionStatus),
				collabStatus: normalize(ps.collabStatus),
				fanartStatus: normalize(ps.fanartStatus),
				guidelineUrl: normalize(ps.guidelineUrl),
				guidelineText: normalize(ps.guidelineText),
				updatedAt: now,
			});

			const updated = await this.creatorSitesRepository.findOneByOrFail({
				id: existing.id,
			});

			return {
				id: updated.id,
				userId: updated.userId,
				title: updated.title,
				catchphrase: updated.catchphrase,
				commissionStatus: updated.commissionStatus,
				collabStatus: updated.collabStatus,
				fanartStatus: updated.fanartStatus,
				guidelineUrl: updated.guidelineUrl,
				guidelineText: updated.guidelineText,
				createdAt: updated.createdAt.toISOString(),
				updatedAt: updated.updatedAt.toISOString(),
			};
		});
	}
}
