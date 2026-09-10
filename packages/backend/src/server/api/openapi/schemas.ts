/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { valibotToOpenApi } from '@/misc/schema/openapi.js';
import { getRegisteredEntities } from '@/misc/schema/registry.js';

/**
 * `components.schemas` の entity 部分を組み立てる。キー順は `defineEntity()` の登録順。
 *
 * NOTE: entity は `defineEntity()` の副作用で登録されるので、entity モジュールが
 * どこからも import されていないと `components.schemas` から漏れる
 * (`@/models/schema/_entities.js` の side-effect import が全 entity の読み込みを保証している)。
 */
function getEntitySchemas(includeSelfRef: boolean): Record<string, any> {
	const result: Record<string, any> = {};

	for (const [key, schema] of getRegisteredEntities()) {
		result[key] = valibotToOpenApi(schema, { use: 'res', includeSelfRef, rootName: key });
	}

	return result;
}

export function getSchemas(includeSelfRef: boolean) {
	return {
		Error: {
			type: 'object',
			properties: {
				error: {
					type: 'object',
					description: 'An error object.',
					properties: {
						code: {
							type: 'string',
							description: 'An error code. Unique within the endpoint.',
						},
						message: {
							type: 'string',
							description: 'An error message.',
						},
						id: {
							type: 'string',
							format: 'uuid',
							description: 'An error ID. This ID is static.',
						},
					},
					required: ['code', 'id', 'message'],
				},
			},
			required: ['error'],
		},

		...getEntitySchemas(includeSelfRef),
	};
}
