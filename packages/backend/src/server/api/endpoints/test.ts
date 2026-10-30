/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['non-productive'],

	description: 'Endpoint for testing input validation.',

	requireCredential: false,

	res: v.object({
		// res側なのにformat: 'misskey:id' (リテラルが'id'でない) ため mi.idString() ではなく mi.format('misskey:id') を使用 (R12)
		id: v.optional(v.pipe(v.string(), mi.format('misskey:id'))),
		required: v.boolean(),
		string: v.optional(v.string()),
		default: v.optional(v.string()),
		nullableDefault: v.optional(v.nullable(v.string()), 'hello'),
	}),
} as const;

export const paramDef = v.object({
	required: v.boolean(),
	string: v.optional(v.string()),
	default: v.optional(v.string(), 'hello'),
	nullableDefault: v.optional(v.nullable(v.string()), 'hello'),
	id: v.optional(mi.misskeyId()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			return ps;
		});
	}
}
