/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedDriveFileSchema } from '@/models/schema/drive-file.js';

export const packedGalleryPostSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	updatedAt: mi.dateTimeString(),
	userId: mi.idString(),
	user: packedUserLiteSchema,
	title: v.string(),
	description: v.nullable(v.string()),
	fileIds: v.optional(v.array(mi.idString())),
	files: v.optional(v.array(packedDriveFileSchema)),
	tags: v.optional(v.array(v.string())),
	isSensitive: v.boolean(),
	likedCount: v.number(),
	isLiked: v.optional(v.boolean()),
});
mi.defineEntity('GalleryPost', packedGalleryPostSchema);

export type PackedGalleryPost = v.InferOutput<typeof packedGalleryPostSchema>;
