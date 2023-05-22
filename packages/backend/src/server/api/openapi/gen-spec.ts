import type { Config } from '@/config.js';
import { endpoints, getEndpointSchema } from 'misskey-js/built/endpoints.js';
import { errors as basicErrors } from './errors.js';
import { schemas } from './schemas.js';
import { Endpoints } from 'misskey-js';

export function genOpenapiSpec(config: Config) {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: config.version,
			title: 'Misskey API',
			'x-logo': { url: '/static-assets/api-doc.png' },
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
			schemas: schemas,

			securitySchemes: {
				ApiKeyAuth: {
					type: 'apiKey',
					in: 'body',
					name: 'i',
				},
			},
		},
	};

	for (const [name, endpoint] of Object.entries(endpoints).filter(([name, ep]) => !ep.secure)) {
		const errors = {} as any;

		if ('errors' in endpoint && endpoint.errors) {
			for (const e of Object.values(endpoint.errors)) {
				errors[e.code] = {
					value: {
						error: e,
					},
				};
			}
		}

		const resSchema = getEndpointSchema('res', name as keyof Endpoints);

		let desc = ('description' in endpoint ? endpoint.description : 'No description provided.') + '\n\n';
		desc += `**Credential required**: *${('requireCredential' in endpoint && endpoint.requireCredential) ? 'Yes' : 'No'}*`;
		if ('kind' in endpoint && endpoint.kind) {
			const kind = endpoint.kind;
			desc += ` / **Permission**: *${kind}*`;
		}

		const requestType = ('requireFile' in endpoint && endpoint.requireFile) ? 'multipart/form-data' : 'application/json';
		const schema = getEndpointSchema('req', name as keyof Endpoints) ?? {};

		const info = {
			operationId: name,
			summary: name,
			description: desc,
			externalDocs: {
				description: 'Source code',
				url: `https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/server/api/endpoints/${name}.ts`,
			},
			...(('tags' in endpoint && endpoint.tags) ? {
				tags: [endpoint.tags[0]],
			} : {}),
			...('requireCredential' in endpoint && endpoint.requireCredential ? {
				security: [{
					ApiKeyAuth: [],
				}],
			} : {}),
			requestBody: {
				required: true,
				content: {
					[requestType]: {
						schema,
					},
				},
			},
			responses: {
				...(resSchema ? {
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
				'400': {
					description: 'Client error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error',
							},
							examples: { ...errors, ...basicErrors['400'] },
						},
					},
				},
				'401': {
					description: 'Authentication error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error',
							},
							examples: basicErrors['401'],
						},
					},
				},
				'403': {
					description: 'Forbidden error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error',
							},
							examples: basicErrors['403'],
						},
					},
				},
				'418': {
					description: 'I\'m Ai',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error',
							},
							examples: basicErrors['418'],
						},
					},
				},
				...(('limit' in endpoint && endpoint.limit) ? {
					'429': {
						description: 'To many requests',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error',
								},
								examples: basicErrors['429'],
							},
						},
					},
				} : {}),
				'500': {
					description: 'Internal server error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error',
							},
							examples: basicErrors['500'],
						},
					},
				},
			},
		};

		spec.paths['/' + name] = {
			post: info,
		};
	}

	return spec;
}
