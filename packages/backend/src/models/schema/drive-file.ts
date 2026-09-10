/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedDriveFolderSchema } from '@/models/schema/drive-folder.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

// NOTE: user.ts とは ESM の循環 import になるため、UserLite の参照は `v.lazy()` 経由にする
// (drive-folder.ts は循環しないので直接参照)
export const packedDriveFileSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	name: mi.example(v.string(), '192.jpg'),
	type: mi.example(v.string(), 'image/jpeg'),
	md5: mi.example(v.pipe(v.string(), mi.format('md5')), '15eca7fba0480996e2245f5185bf39f2'),
	size: mi.example(v.number(), 51469),
	isSensitive: v.boolean(),
	blurhash: v.nullable(v.string()),
	properties: v.object({
		width: mi.example(v.optional(v.number()), 1280),
		height: mi.example(v.optional(v.number()), 720),
		orientation: mi.example(v.optional(v.number()), 8),
		avgColor: mi.example(v.optional(v.string()), 'rgb(40,65,87)'),
	}),
	url: mi.urlString(),
	thumbnailUrl: v.nullable(mi.urlString()),
	comment: v.nullable(v.string()),
	folderId: mi.example(v.nullable(mi.idString()), 'xxxxxxxxxx'),
	folder: v.nullish(packedDriveFolderSchema),
	userId: mi.example(v.nullable(mi.idString()), 'xxxxxxxxxx'),
	user: v.nullish(v.lazy(() => packedUserLiteSchema)),
});
mi.defineEntity('DriveFile', packedDriveFileSchema);

export type PackedDriveFile = v.InferOutput<typeof packedDriveFileSchema>;
