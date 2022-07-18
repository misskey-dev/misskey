import endpoints from '../endpoints.js';
import config from '@/config/index.js';
import { errors as basicErrors } from './errors.js';
import { schemas, convertSchemaToOpenApiSchema } from './schemas.js';

export function genOpenapiSpec() {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: 'v1',
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
				// TODO: change this to oauth2 when the remaining oauth stuff is set up
				Bearer: {
					type: 'http',
					scheme: 'bearer',
				}
			},
		},
	};

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		const errors = {} as any;

		if (endpoint.meta.errors) {
			for (const e of Object.values(endpoint.meta.errors)) {
				errors[e.code] = {
					value: {
						error: e,
					},
				};
			}
		}

		const resSchema = endpoint.meta.res ? convertSchemaToOpenApiSchema(endpoint.meta.res) : {};

		let desc = (endpoint.meta.description ? endpoint.meta.description : 'No description provided.') + '\n\n';
		desc += `**Credential required**: *${endpoint.meta.requireCredential ? 'Yes' : 'No'}*`;
		if (endpoint.meta.kind) {
			const kind = endpoint.meta.kind;
			desc += ` / **Permission**: *${kind}*`;
		}

		const requestType = endpoint.meta.requireFile ? 'multipart/form-data' : 'application/json';
		const schema = endpoint.params;

		if (endpoint.meta.requireFile) {
			schema.properties.file = {
				type: 'string',
				format: 'binary',
				description: 'The file contents.',
			};
			schema.required.push('file');
		}

		const security = [
			{
				ApiKeyAuth: [],
			},
			{
				Bearer: [],
			},
		];
		if (!endpoint.meta.requireCredential) {
			// add this to make authentication optional
			security.push({});
		}

		const info = {
			operationId: endpoint.name,
			summary: endpoint.name,
			description: desc,
			externalDocs: {
				description: 'Source code',
				url: `https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/server/api/endpoints/${endpoint.name}.ts`,
			},
			tags: endpoint.meta.tags || undefined,
			security,
			requestBody: {
				required: true,
				content: {
					[requestType]: {
						schema,
					},
				},
			},
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
				...(endpoint.meta.limit ? {
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

		const path = {
			post: info,
		};
		if (endpoint.meta.allowGet) {
			path.get = { ...info };
			// API Key authentication is not permitted for GET requests
			path.get.security = path.get.security.filter(elem => !Object.prototype.hasOwnProperty.call(elem, 'ApiKeyAuth'));
		}

		spec.paths['/' + endpoint.name] = path;
	}

	return spec;
}
