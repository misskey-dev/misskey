/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedDriveFileSchema } from '@/models/schema/drive-file.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

/**
 * PageBlock は `section` ブロックの `children` が自分自身を含む循環スキーマなので、
 * 出力型を手書きして `v.GenericSchema<...>` で明示注釈する (cookbook R13)。
 */
export type PackedPageBlock =
	| { id: string, type: 'text', text: string }
	| { id: string, type: 'section', title: string, children: PackedPageBlock[] }
	| { id: string, type: 'image', fileId: string | null }
	| { id: string, type: 'note', detailed: boolean, note: string | null };

const blockBaseEntries = {
	id: v.string(),
	type: v.string(),
};

const textBlockSchema = v.object({
	...blockBaseEntries,
	type: v.literal('text'),
	text: v.string(),
});

const sectionBlockSchema = v.object({
	...blockBaseEntries,
	type: v.literal('section'),
	title: v.string(),
	// legacy の `ref: 'PageBlock', selfRef: true` 相当 (cookbook R13)
	children: v.array(v.pipe(v.lazy(() => packedPageBlockSchema), mi.selfRef())),
});

const imageBlockSchema = v.object({
	...blockBaseEntries,
	type: v.literal('image'),
	fileId: v.nullable(v.string()),
});

const noteBlockSchema = v.object({
	...blockBaseEntries,
	type: v.literal('note'),
	detailed: v.boolean(),
	note: v.nullable(v.string()),
});

export const packedPageBlockSchema: v.GenericSchema<PackedPageBlock> = v.variant('type', [
	textBlockSchema,
	sectionBlockSchema,
	imageBlockSchema,
	noteBlockSchema,
]);
mi.defineEntity('PageBlock', packedPageBlockSchema);

// NOTE: user.ts / drive-file.ts とは ESM の循環 import になるため、参照は `v.lazy()` 経由にする
export const packedPageSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	updatedAt: mi.dateTimeString(),
	userId: mi.idString(),
	user: v.lazy(() => packedUserLiteSchema),
	content: v.array(packedPageBlockSchema),
	variables: v.array(mi.anyObject()),
	title: v.string(),
	name: v.string(),
	summary: v.nullable(v.string()),
	hideTitleWhenPinned: v.boolean(),
	alignCenter: v.boolean(),
	font: v.picklist(['serif', 'sans-serif']),
	script: v.string(),
	eyeCatchingImageId: v.nullable(v.string()),
	eyeCatchingImage: v.nullable(v.lazy(() => packedDriveFileSchema)),
	attachedFiles: v.array(v.lazy(() => packedDriveFileSchema)),
	likedCount: v.number(),
	isLiked: v.optional(v.boolean()),
});
mi.defineEntity('Page', packedPageSchema);

/**
 * NOTE: `content` は意図的に `any[]` のままにしている ({@link PackedPageBlock} へは厳密化しない)。
 *
 * `PackedPageBlock` は spec (api.json) 上のブロック種別 4 つ (text / section / image / note) しか
 * 表していないが、DB (`MiPage.content` = `Record<string, any>[]`) には spec に無い種別も入る
 * (`PageEntityService#pack` の後方互換 migrate が `input` を `textInput` / `numberInput` に
 * 書き換えている)。`PackedPageBlock[]` に狭めると「実際に返り得る値」を型が誤って表すことになり、
 * 唯一の生成元である PageEntityService でキャストを強いるだけなので、実態に合う `any[]` を正とする。
 */
export type PackedPage = Omit<v.InferOutput<typeof packedPageSchema>, 'content'> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	content: any[];
};
