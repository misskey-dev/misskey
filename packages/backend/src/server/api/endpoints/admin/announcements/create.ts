/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:announcements',

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
			icon: {
				type: 'string',
				optional: false, nullable: false,
			},
			display: {
				type: 'string',
				optional: false, nullable: false,
			},
			forYou: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			needConfirmationToRead: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			needEnrollmentTutorialToRead: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			closeDuration: {
				type: 'number',
				optional: false, nullable: false,
			},
			displayOrder: {
				type: 'number',
				optional: false, nullable: false,
			},
			silence: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isRead: {
				type: 'boolean',
				optional: true, nullable: false,
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
		icon: { type: 'string', enum: ['info', 'warning', 'error', 'success'], default: 'info' },
		display: { type: 'string', enum: ['normal', 'banner', 'dialog'], default: 'normal' },
		forExistingUsers: { type: 'boolean', default: false },
		needConfirmationToRead: { type: 'boolean', default: false },
		needEnrollmentTutorialToRead: { type: 'boolean', default: false },
		closeDuration: { type: 'number', default: 0 },
		displayOrder: { type: 'number', default: 0 },
		silence: { type: 'boolean', default: false },
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['title', 'text', 'imageUrl'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private announcementService: AnnouncementService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const { raw, packed } = await this.announcementService.create({
				updatedAt: null,
				title: ps.title,
				text: ps.text,
				imageUrl: ps.imageUrl,
				icon: ps.icon,
				display: ps.display,
				forExistingUsers: ps.forExistingUsers,
				needConfirmationToRead: ps.needConfirmationToRead,
				needEnrollmentTutorialToRead: ps.needEnrollmentTutorialToRead,
				closeDuration: ps.closeDuration,
				displayOrder: ps.displayOrder,
				silence: ps.silence,
				userId: ps.userId,
			}, me);

			return packed;
		});
	}
}
