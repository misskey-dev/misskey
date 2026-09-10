/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:announcements',

	res: v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		createdAt: mi.dateTimeString(),
		updatedAt: v.nullable(mi.dateTimeString()),
		title: v.string(),
		text: v.string(),
		imageUrl: v.nullable(v.string()),
	}),
} as const;

export const paramDef = v.object({
	title: v.pipe(v.string(), mi.minCodePoints(1)),
	text: v.pipe(v.string(), mi.minCodePoints(1)),
	imageUrl: v.nullable(v.pipe(v.string(), mi.minCodePoints(0))),
	icon: v.optional(v.picklist(['info', 'warning', 'error', 'success']), 'info'),
	display: v.optional(v.picklist(['normal', 'banner', 'dialog']), 'normal'),
	forExistingUsers: v.optional(v.boolean(), false),
	silence: v.optional(v.boolean(), false),
	needConfirmationToRead: v.optional(v.boolean(), false),
	userId: v.optional(v.nullable(mi.misskeyId()), null),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private announcementService: AnnouncementService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const { packed } = await this.announcementService.create({
				updatedAt: null,
				title: ps.title,
				text: ps.text,
				/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
				imageUrl: ps.imageUrl || null,
				icon: ps.icon,
				display: ps.display,
				forExistingUsers: ps.forExistingUsers,
				silence: ps.silence,
				needConfirmationToRead: ps.needConfirmationToRead,
				userId: ps.userId,
			}, me);

			return packed;
		});
	}
}
