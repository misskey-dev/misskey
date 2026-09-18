/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	res: v.object({
		pong: v.number(),
	}),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
	) {
		super(meta, paramDef, async () => {
			return {
				pong: Date.now(),
			};
		});
	}
}
