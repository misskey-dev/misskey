/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaEntityService } from '@/core/entities/MetaEntityService.js';
import { packedMetaDetailedSchema, packedMetaLiteSchema } from '@/models/schema/meta.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	// NOTE: 判別子の無い oneOf なので v.union + asOneOf、legacy が併記していた `type: 'object'` は
	// union には出せないので openApi() で補って現行出力を維持する
	res: v.pipe(
		v.union([
			packedMetaLiteSchema,
			packedMetaDetailedSchema,
		]),
		mi.asOneOf(),
		mi.openApi({ type: 'object' }),
	),
} as const;

export const paramDef = v.object({
	detail: v.optional(v.boolean(), true),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private metaEntityService: MetaEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return ps.detail ? await this.metaEntityService.packDetailed() : await this.metaEntityService.pack();
		});
	}
}
