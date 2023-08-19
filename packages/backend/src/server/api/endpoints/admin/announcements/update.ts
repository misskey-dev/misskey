/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository } from '@/models/index.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1 },
		text: { type: 'string', minLength: 1 },
		imageUrl: { type: 'string', nullable: true, minLength: 0 },
		icon: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
		display: { type: 'string', enum: ['normal', 'banner', 'dialog'] },
		forExistingUsers: { type: 'boolean' },
		needConfirmationToRead: { type: 'boolean' },
		closeDuration: { type: 'number', default: 0 },
		displayOrder: { type: 'number', default: 0 },
		isActive: { type: 'boolean' },
	},
	required: ['id'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private announcementService: AnnouncementService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const announcement = await this.announcementsRepository.findOneBy({ id: ps.id });

			if (announcement == null) throw new ApiError(meta.errors.noSuchAnnouncement);

			await this.announcementService.update(announcement.id, ps);
		});
	}
}
