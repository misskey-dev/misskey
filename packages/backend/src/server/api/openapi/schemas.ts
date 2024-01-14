/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Schema } from '@/misc/json-schema.js';
import { refs } from '@/misc/json-schema.js';

export function convertSchemaToOpenApiSchema(schema: Schema, type: 'param' | 'res') {
	// optional, nullable, refはスキーマ定義に含まれないので分離しておく
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { optional, nullable, ref, ...res }: any = schema;

	if (schema.type === 'object' && schema.properties) {
		if (type === 'res') {
			const required = Object.entries(schema.properties).filter(([k, v]) => !v.optional).map(([k]) => k);
			if (required.length > 0) {
			// 空配列は許可されない
				res.required = required;
			}
		}

		for (const k of Object.keys(schema.properties)) {
			res.properties[k] = convertSchemaToOpenApiSchema(schema.properties[k], type);
		}
	}

	if (schema.type === 'array' && schema.items) {
		res.items = convertSchemaToOpenApiSchema(schema.items, type);
	}

	for (const o of ['anyOf', 'oneOf', 'allOf'] as const) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (o in schema) res[o] = schema[o]!.map(schema => convertSchemaToOpenApiSchema(schema, type));
	}

	if (type === 'res' && schema.ref) {
		const $ref = `#/components/schemas/${schema.ref}`;
		if (schema.nullable || schema.optional) {
			res.allOf = [{ $ref }];
		} else {
			res.$ref = $ref;
		}
	}

	if (schema.nullable) {
		if (Array.isArray(schema.type) && !schema.type.includes('null')) {
			res.type.push('null');
		} else if (typeof schema.type === 'string') {
			res.type = [res.type, 'null'];
		}
	}

	return res;
}

export const schemas = {
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

	...Object.fromEntries(
		Object.entries(refs).map(([key, schema]) => [key, convertSchemaToOpenApiSchema(schema, 'res')]),
	),
};
