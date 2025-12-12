/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Announcement',
	},

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'b57b5e1d-4f49-404a-9edb-46b00268f121',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		announcementId: { type: 'string', format: 'misskey:id' },
	},
	required: ['announcementId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private announcementService: AnnouncementService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				return await this.announcementService.getAnnouncement(ps.announcementId, me);
			} catch (err) {
				if (err instanceof EntityNotFoundError) throw new ApiError(meta.errors.noSuchAnnouncement);
				throw err;
			}
		});
	}
}
