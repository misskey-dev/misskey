/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedAnnouncementSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	updatedAt: v.nullable(mi.dateTimeString()),
	text: v.string(),
	title: v.string(),
	imageUrl: v.nullable(v.string()),
	icon: v.picklist(['info', 'warning', 'error', 'success']),
	display: v.picklist(['dialog', 'normal', 'banner']),
	needConfirmationToRead: v.boolean(),
	silence: v.boolean(),
	forYou: v.boolean(),
	isRead: v.optional(v.boolean()),
});
mi.defineEntity('Announcement', packedAnnouncementSchema);

export type PackedAnnouncement = v.InferOutput<typeof packedAnnouncementSchema>;
