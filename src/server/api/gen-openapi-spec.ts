import endpoints from './endpoints';
import { Context } from 'cafy';
import config from '../../config';

const basicErrors = {
	'400': {
		'INVALID_PARAM': {
			value: {
				message: 'Invalid param.',
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			}
		}
	},
	'403': {
		'AUTHENTICATION_FAILED': {
			value: {
				message: 'Authentication failed. Please ensure your token is correct.',
				code: 'AUTHENTICATION_FAILED',
				id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
			}
		}
	},
	'429': {
		'RATE_LIMIT_EXCEEDED': {
			value: {
				message: 'Rate limit exceeded. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
			}
		}
	}
};

const schemas = {
	Error: {
		type: 'object',
		properties: {
			code: { type: 'string' },
			message: { type: 'string' },
			id: { type: 'string' }
		},
		required: ['code', 'id', 'message']
	},

	User: {
		type: 'object',
		properties: {
			id: { type: 'string' },
			username: { type: 'string' },
		},
		required: ['id', 'username']
	},

	Note: {
		type: 'object',
		properties: {
			id: { type: 'string' },
			text: { type: 'string' },
			user: { $ref: '#/components/schemas/User' }
		},
		required: ['id']
	}
};

export function genOpenapiSpec(lang = 'ja-JP') {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: '1',
			title: 'Misskey API',
			description: 'Misskey is a decentralized microblogging platform.',
		},

		servers: [{
			url: config.api_url
		}],

		paths: {} as any,

		components: {
			schemas: schemas,

			securitySchemes: {
				ApiKeyAuth: {
					type: 'apiKey',
					in: 'body',
					name: 'i'
				}
			}
		}
	};

	function genProps(props: { [key: string]: Context & { desc: any }; }) {
		const properties = {} as any;

		const kvs = Object.entries(props);

		for (const kv of kvs) {
			properties[kv[0]] = genProp(kv[1], kv[1].desc);
		}

		return properties;
	}

	function genProp(param: Context, desc?: string): any {
		const required = param.name === 'Object' ? (param as any).props ? Object.entries((param as any).props).filter(([k, v]: any) => !v.isOptional).map(([k, v]) => k) : [] : [];
		return {
			description: desc,
			type: param.name === 'ID' ? 'string' : param.name.toLowerCase(),
			nullable: param.isNullable,
			...(param.name === 'Object' ? {
				...(required.length > 0 ? { required } : {}),
				properties: (param as any).props ? genProps((param as any).props) : {}
			} : {}),
			...(param.name === 'Array' ? {
				items: (param as any).ctx ? genProp((param as any).ctx) : {}
			} : {})
		};
	}

	for (const endpoint of endpoints) {
		const porops = {} as any;
		const errors = {} as any;

		if (endpoint.meta.errors) {
			for (const e of Object.values(endpoint.meta.errors)) {
				errors[e.code] = {
					value: e
				};
			}
		}

		if (endpoint.meta.params) {
			for (const kv of Object.entries(endpoint.meta.params)) {
				if (kv[1].desc) (kv[1].validator as any).desc = kv[1].desc[lang];
				porops[kv[0]] = kv[1].validator;
			}
		}

		const required = endpoint.meta.params ? Object.entries(endpoint.meta.params).filter(([k, v]) => !v.validator.isOptional).map(([k, v]) => k) : [];

		const resSchema = endpoint.meta.res ? renderType(endpoint.meta.res) : {};

		function renderType(x: any) {
			const res = {} as any;

			if (['User', 'Note'].includes(x.type)) {
				res['$ref'] = `#/components/schemas/${x.type}`;
			} else if (x.type === 'object') {
				res['type'] = 'object';
				const props = {} as any;
				for (const kv of Object.entries(x.props)) {
					props[kv[0]] = renderType(kv[1]);
				}
				res['properties'] = props;
			} else {
				res['type'] = x.type;
			}

			return res;
		}

		const info = {
			summary: endpoint.name,
			description: endpoint.meta.desc ? endpoint.meta.desc[lang] : 'No description provided.',
			...(endpoint.meta.requireCredential ? {
				security: [{
					ApiKeyAuth: []
				}]
			} : {}),
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							...(required.length > 0 ? { required } : {}),
							properties: endpoint.meta.params ? genProps(porops) : {}
						}
					}
				}
			},
			responses: {
				...(endpoint.meta.res ? {
					'200': {
						description: 'OK (with results)',
						content: {
							'application/json': {
								schema: resSchema
							}
						}
					}
				} : {
					'204': {
						description: 'OK (without any results)',
					}
				}),
				'400': {
					description: 'Client error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: { ...errors, ...basicErrors['400'] }
						}
					}
				},
				'403': {
					description: 'Authentication error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['403']
						}
					}
				},
				...(endpoint.meta.limit ? {
					'429': {
						description: 'To many requests',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								examples: basicErrors['429']
							}
						}
					}
				} : {})
			}
		};

		spec.paths['/' + endpoint.name] = {
			post: info
		};
	}

	return spec;
}
