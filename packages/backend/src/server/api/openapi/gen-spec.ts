/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import { resAllowsEmpty } from '@/misc/schema/introspect.js';
import { valibotToOpenApi } from '@/misc/schema/openapi.js';
import endpoints from '../endpoints.js';
import { errors as basicErrors } from './errors.js';
import { getSchemas } from './schemas.js';

/**
 * エラーレスポンスの description。basicErrors のステータス以外は meta.errors の
 * httpStatusCode から動的に生えるため、既知のものは名前を付けておく
 */
const errorResponseDescriptions: Record<string, string> = {
	'400': 'Client error',
	'401': 'Authentication error',
	'403': 'Forbidden error',
	'404': 'Not found',
	'413': 'Payload too large',
	'418': 'I\'m Ai',
	'422': 'Unprocessable entity',
	'429': 'Too many requests',
	'500': 'Internal server error',
};

function describeErrorStatus(status: string): string {
	return errorResponseDescriptions[status] ?? (Number(status) >= 500 ? 'Server error' : 'Client error');
}

function makeErrorResponse(status: string, examples: Record<string, unknown>) {
	return {
		description: describeErrorStatus(status),
		content: {
			'application/json': {
				schema: {
					$ref: '#/components/schemas/Error',
				},
				examples,
			},
		},
	};
}

export function genOpenapiSpec(config: Config, includeSelfRef = false) {
	const spec = {
		openapi: '3.1.0',

		info: {
			version: config.version,
			title: 'Misskey API',
		},

		externalDocs: {
			description: 'Repository',
			url: 'https://github.com/misskey-dev/misskey',
		},

		servers: [{
			url: config.apiUrl,
		}],

		paths: {} as any,

		components: {
			schemas: getSchemas(includeSelfRef),

			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
				},
			},
		},
	};

	// NOTE: endpoints 自体をディープコピーすることはできない (Valibot スキーマは関数を含むため
	// JSON 往復で壊れる)。代わりに、endpoints から読み取った値を **変換後のプレーンな OpenAPI 構造**
	// にしてからディープコピーして spec に載せる。こうしないと生成物が endpoints の meta を参照した
	// ままになり、生成物を書き換えたときにメモリ上の値が汚れて次回以降の出力に影響する
	for (const endpoint of endpoints) {
		// meta.errors を「実際に返される HTTP ステータスコード」ごとに振り分ける。
		// httpStatusCode を持たないエラーは ApiCallService が 400 として返すため 400 に入れる
		const errorExamplesByStatus = new Map<string, Record<string, unknown>>();

		if (endpoint.meta.errors) {
			for (const e of Object.values(endpoint.meta.errors)) {
				const status = String(e.httpStatusCode ?? 400);
				const examples = errorExamplesByStatus.get(status) ?? {};
				examples[e.code] = {
					value: {
						error: e,
					},
				};
				errorExamplesByStatus.set(status, examples);
			}
		}

		// basicErrors のステータス (429 は rate limit のある endpoint のみ) と
		// meta.errors 由来のステータスの和集合を、ステータスコード昇順で出力する
		const errorStatuses = [...new Set([
			...Object.keys(basicErrors).filter(status => status !== '429' || endpoint.meta.limit),
			...errorExamplesByStatus.keys(),
		])].sort((a, b) => Number(a) - Number(b));

		const errorResponses = Object.fromEntries(errorStatuses.map(status => [status, makeErrorResponse(status, {
			...errorExamplesByStatus.get(status),
			...basicErrors[status as keyof typeof basicErrors],
		})]));

		const resSchema = endpoint.meta.res ? valibotToOpenApi(endpoint.meta.res, { use: 'res', includeSelfRef }) : {};

		let desc = (endpoint.meta.description ? endpoint.meta.description : 'No description provided.') + '\n\n';

		if (endpoint.meta.secure) {
			desc += '**Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.\n';
		}

		desc += `**Credential required**: *${endpoint.meta.requireCredential ? 'Yes' : 'No'}*`;
		if (endpoint.meta.kind) {
			const kind = endpoint.meta.kind;
			desc += ` / **Permission**: *${kind}*`;
		}

		const requestType = endpoint.meta.requireFile ? 'multipart/form-data' : 'application/json';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const schema: any = { ...valibotToOpenApi(endpoint.params, { use: 'param', includeSelfRef: false }) };

		// `meta.requireFile` の endpoint (drive/files/create のみ) はリクエストが multipart/form-data で
		// 運ばれ、`file` は paramDef ではなく ApiCallService が受け取る (paramDef には現れない) ため、
		// spec 上の `file` プロパティはここで注入する。`schema` は valibotToOpenApi() が返した
		// **変換後のプレーンな OpenAPI 構造** なので properties / required に直接足してよい。
		if (endpoint.meta.requireFile) {
			schema.properties = {
				...schema.properties,
				file: {
					type: 'string',
					format: 'binary',
					description: 'The file contents.',
				},
			};
			schema.required = [...schema.required ?? [], 'file'];
		}

		if (schema.required && schema.required.length <= 0) {
			// 空配列は許可されない
			schema.required = undefined;
		}

		const hasBody = (schema.type === 'object' && schema.properties && Object.keys(schema.properties).length >= 1)
			|| ['allOf', 'oneOf', 'anyOf'].some(o => (Array.isArray(schema[o]) && schema[o].length > 0));

		const info = {
			operationId: endpoint.name.replaceAll('/', '___'), // NOTE: スラッシュは使えない
			summary: endpoint.name,
			description: desc,
			externalDocs: {
				description: 'Source code',
				url: `https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/server/api/endpoints/${endpoint.name}.ts`,
			},
			...(endpoint.meta.tags ? {
				tags: [endpoint.meta.tags[0]],
			} : {}),
			...(endpoint.meta.requireCredential ? {
				security: [{
					bearerAuth: [],
				}],
			} : {}),
			...(hasBody ? {
				requestBody: {
					required: true,
					content: {
						[requestType]: {
							schema,
						},
					},
				},
			} : {}),
			responses: {
				...(endpoint.meta.res ? {
					'200': {
						description: 'OK (with results)',
						content: {
							'application/json': {
								schema: resSchema,
							},
						},
					},
				} : {
					'204': {
						description: 'OK (without any results)',
					},
				}),
				...(resAllowsEmpty(endpoint.meta.res) ? {
					'204': {
						description: 'OK (without any results)',
					},
				} : {}),
				...errorResponses,
			},
		};

		// ここまでで info はプレーンな OpenAPI 構造 (meta.errors 等の参照は含む) なので、
		// spec に載せる前にディープコピーして endpoints 側との参照共有を切る
		spec.paths['/' + endpoint.name] = structuredClone({
			...(endpoint.meta.allowGet ? {
				get: {
					...info,
					operationId: 'get___' + info.operationId,
				},
			} : {}),
			post: {
				...info,
				operationId: 'post___' + info.operationId,
			},
		});
	}

	return spec;
}
