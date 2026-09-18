/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { getParamTypes } from '@/misc/schema/param-introspect.js';

// 循環参照を回避
let endpointsPromise: Promise<typeof import('../endpoints.js').default> | undefined;

function getEndpoints() {
	return endpointsPromise ??= import('../endpoints.js').then(module => module.default);
}

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	res: v.nullable(v.object({
		params: v.array(v.object({
			name: v.string(),
			type: v.string(),
		})),
	})),
} as const;

export const paramDef = v.object({
	endpoint: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
	) {
		super(meta, paramDef, async (ps) => {
			const endpoints = await getEndpoints();
			const ep = endpoints.find(x => x.name === ps.endpoint);
			if (ep == null) return null;
			return {
				// 型名は旧実装 (JSON Schema の `type` キーワードを先頭大文字化、`type` 無しは 'string')
				// と同じ表記にする
				params: getParamTypes(ep.params).map(({ name, type }) => ({
					name,
					type: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'string',
				})),
			};
		});
	}
}
