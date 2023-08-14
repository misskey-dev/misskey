/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AnnouncementsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			updatedAt: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
			title: {
				type: 'string',
				optional: false, nullable: false,
			},
			text: {
				type: 'string',
				optional: false, nullable: false,
			},
			imageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			displayOrder: {
				type: 'number',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: true,
			},
			closeDuration: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1 },
		text: { type: 'string', minLength: 1 },
		imageUrl: { type: 'string', nullable: true, minLength: 1 },
		displayOrder: { type: 'number' },
		userId: { type: 'string', nullable: true, format: 'misskey:id' },
		closeDuration: { type: 'number', nullable: false },
	},
	required: ['title', 'text', 'imageUrl'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const announcement = await this.announcementsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				updatedAt: null,
				title: ps.title,
				text: ps.text,
				imageUrl: ps.imageUrl,
				displayOrder: ps.displayOrder,
				userId: ps.userId ?? null,
				closeDuration: ps.closeDuration,
			}).then(x => this.announcementsRepository.findOneByOrFail(x.identifiers[0]));

			return Object.assign({}, announcement, { createdAt: announcement.createdAt.toISOString(), updatedAt: null });
		});
	}
}
