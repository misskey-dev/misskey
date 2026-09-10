/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

/**
 * `parent` が自分自身を指す循環スキーマなので、出力型を手書きして
 * `v.GenericSchema<...>` で明示注釈する (cookbook R13)。
 */
export type PackedDriveFolder = {
	id: string;
	createdAt: string;
	name: string;
	parentId: string | null;
	foldersCount?: number;
	filesCount?: number;
	parent?: PackedDriveFolder | null;
};

export const packedDriveFolderSchema: v.GenericSchema<PackedDriveFolder> = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	name: v.string(),
	parentId: mi.example(v.nullable(mi.idString()), 'xxxxxxxxxx'),
	foldersCount: v.optional(v.number()),
	filesCount: v.optional(v.number()),
	parent: v.optional(v.nullable(v.lazy(() => packedDriveFolderSchema))),
});
mi.defineEntity('DriveFolder', packedDriveFolderSchema);
