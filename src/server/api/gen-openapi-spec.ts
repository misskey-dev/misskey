import endpoints from './endpoints';
import { Context } from 'cafy';
import config from '../../config';

const basicErrors = {
	'400': {
		'INVALID_PARAM': {
			value: {
				error: {
					message: 'Invalid param.',
					code: 'INVALID_PARAM',
					id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				}
			}
		}
	},
	'401': {
		'CREDENTIAL_REQUIRED': {
			value: {
				error: {
					message: 'Credential required.',
					code: 'CREDENTIAL_REQUIRED',
					id: '1384574d-a912-4b81-8601-c7b1c4085df1',
				}
			}
		}
	},
	'403': {
		'AUTHENTICATION_FAILED': {
			value: {
				error: {
					message: 'Authentication failed. Please ensure your token is correct.',
					code: 'AUTHENTICATION_FAILED',
					id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
				}
			}
		}
	},
	'418': {
		'I_AM_AI': {
			value: {
				error: {
					message: 'You sent a request to Ai-chan, Misskey\'s showgirl, instead of the server.',
					code: 'I_AM_AI',
					id: '60c46cd1-f23a-46b1-bebe-5d2b73951a84',
				}
			}
		}
	},
	'429': {
		'RATE_LIMIT_EXCEEDED': {
			value: {
				error: {
					message: 'Rate limit exceeded. Please try again later.',
					code: 'RATE_LIMIT_EXCEEDED',
					id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
				}
			}
		}
	},
	'500': {
		'INTERNAL_ERROR': {
			value: {
				error: {
					message: 'Internal error occurred. Please contact us if the error persists.',
					code: 'INTERNAL_ERROR',
					id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
				}
			}
		}
	}
};

const schemas = {
	Error: {
		type: 'object',
		properties: {
			error: {
				type: 'object',
				description: 'An error object.',
				properties: {
					code: {
						type: 'string',
						description: 'An error code.',
					},
					message: {
						type: 'string',
						description: 'An error message.',
					},
					id: {
						type: 'string',
						format: 'uuid',
						description: 'An error ID. This ID is static.',
					}
				},
				required: ['code', 'id', 'message']
			},
		},
		required: ['error']
	},

	User: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this User.'
			},
			username: {
				type: 'string',
				description: 'The screen name, handle, or alias that this user identifies themselves with.',
				example: 'ai'
			},
			name: {
				type: 'string',
				nullable: true,
				description: 'The name of the user, as they’ve defined it.',
				example: '藍'
			},
			host: {
				type: 'string',
				nullable: true,
				example: 'misskey.example.com'
			},
			description: {
				type: 'string',
				nullable: true,
				description: 'The user-defined UTF-8 string describing their account.',
				example: 'Hi masters, I am Ai!'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the user account was created on Misskey.'
			},
			followersCount: {
				type: 'number',
				description: 'The number of followers this account currently has.'
			},
			followingCount: {
				type: 'number',
				description: 'The number of users this account is following.'
			},
			notesCount: {
				type: 'number',
				description: 'The number of Notes (including renotes) issued by the user.'
			},
			isBot: {
				type: 'boolean',
				description: 'Whether this account is a bot.'
			},
			isCat: {
				type: 'boolean',
				description: 'Whether this account is a cat.'
			},
			isAdmin: {
				type: 'boolean',
				description: 'Whether this account is the admin.'
			},
			isVerified: {
				type: 'boolean'
			},
			isLocked: {
				type: 'boolean'
			},
		},
		required: ['id', 'name', 'username', 'createdAt']
	},

	Note: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Note.'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the Note was created on Misskey.'
			},
			text: {
				type: 'string'
			},
			cw: {
				type: 'string'
			},
			userId: {
				type: 'string',
				format: 'id',
			},
			user: {
				$ref: '#/components/schemas/User'
			},
			replyId: {
				type: 'string',
				format: 'id',
			},
			renoteId: {
				type: 'string',
				format: 'id',
			},
			reply: {
				$ref: '#/components/schemas/Note'
			},
			renote: {
				$ref: '#/components/schemas/Note'
			},
			viaMobile: {
				type: 'boolean'
			},
			visibility: {
				type: 'string'
			},
		},
		required: ['id', 'userId', 'createdAt']
	},

	DriveFile: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Drive file.'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the Drive file was created on Misskey.'
			},
			name: {
				type: 'string',
				description: 'The file name with extension.',
				example: 'lenna.jpg'
			},
			type: {
				type: 'string',
				description: 'The MIME type of this Drive file.',
				example: 'image/jpeg'
			},
			md5: {
				type: 'string',
				format: 'md5',
				description: 'The MD5 hash of this Drive file.',
				example: '15eca7fba0480996e2245f5185bf39f2'
			},
			datasize: {
				type: 'number',
				description: 'The size of this Drive file. (bytes)',
				example: 51469
			},
			folderId: {
				type: 'string',
				format: 'id',
				nullable: true,
				description: 'The parent folder ID of this Drive file.',
			},
			isSensitive: {
				type: 'boolean',
				description: 'Whether this Drive file is sensitive.',
			},
		},
		required: ['id', 'createdAt', 'name', 'type', 'datasize', 'md5']
	}
};

export function genOpenapiSpec(lang = 'ja-JP') {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: 'v1',
			title: 'Misskey API',
			description: 'Misskey is a decentralized microblogging platform.',
			'x-logo': { url: '/assets/api-doc.png' }
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

	function genProps(props: { [key: string]: Context & { desc: any, default: any }; }) {
		const properties = {} as any;

		const kvs = Object.entries(props);

		for (const kv of kvs) {
			properties[kv[0]] = genProp(kv[1], kv[1].desc, kv[1].default);
		}

		return properties;
	}

	function genProp(param: Context, desc?: string, _default?: any): any {
		const required = param.name === 'Object' ? (param as any).props ? Object.entries((param as any).props).filter(([k, v]: any) => !v.isOptional).map(([k, v]) => k) : [] : [];
		return {
			description: desc,
			default: _default,
			...(_default ? { default: _default } : {}),
			type: param.name === 'ID' ? 'string' : param.name.toLowerCase(),
			...(param.name === 'ID' ? { example: 'xxxxxxxxxxxxxxxxxxxxxxxx', format: 'id' } : {}),
			nullable: param.isNullable,
			...(param.name === 'String' ? {
				...((param as any).enum ? { enum: (param as any).enum } : {}),
				...((param as any).minLength ? { minLength: (param as any).minLength } : {}),
				...((param as any).maxLength ? { maxLength: (param as any).maxLength } : {}),
			} : {}),
			...(param.name === 'Number' ? {
				...((param as any).minimum ? { minimum: (param as any).minimum } : {}),
				...((param as any).maximum ? { maximum: (param as any).maximum } : {}),
			} : {}),
			...(param.name === 'Object' ? {
				...(required.length > 0 ? { required } : {}),
				properties: (param as any).props ? genProps((param as any).props) : {}
			} : {}),
			...(param.name === 'Array' ? {
				items: (param as any).ctx ? genProp((param as any).ctx) : {}
			} : {})
		};
	}

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		const porops = {} as any;
		const errors = {} as any;

		if (endpoint.meta.errors) {
			for (const e of Object.values(endpoint.meta.errors)) {
				errors[e.code] = {
					value: {
						error: e
					}
				};
			}
		}

		if (endpoint.meta.params) {
			for (const kv of Object.entries(endpoint.meta.params)) {
				if (kv[1].desc) (kv[1].validator as any).desc = kv[1].desc[lang];
				if (kv[1].default) (kv[1].validator as any).default = kv[1].default;
				porops[kv[0]] = kv[1].validator;
			}
		}

		const required = endpoint.meta.params ? Object.entries(endpoint.meta.params).filter(([k, v]) => !v.validator.isOptional).map(([k, v]) => k) : [];

		const resSchema = endpoint.meta.res ? renderType(endpoint.meta.res) : {};

		function renderType(x: any) {
			const res = {} as any;

			if (['User', 'Note', 'DriveFile'].includes(x.type)) {
				res['$ref'] = `#/components/schemas/${x.type}`;
			} else if (x.type === 'object') {
				res['type'] = 'object';
				if (x.props) {
					const props = {} as any;
					for (const kv of Object.entries(x.props)) {
						props[kv[0]] = renderType(kv[1]);
					}
					res['properties'] = props;
				}
			} else if (x.type === 'array') {
				res['type'] = 'array';
				if (x.items) {
					res['items'] = renderType(x.items);
				}
			} else {
				res['type'] = x.type;
			}

			return res;
		}

		const info = {
			summary: endpoint.name,
			description: endpoint.meta.desc ? endpoint.meta.desc[lang] : 'No description provided.',
			...(endpoint.meta.tags ? {
				tags: endpoint.meta.tags
			} : {}),
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
				'401': {
					description: 'Authentication error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['401']
						}
					}
				},
				'403': {
					description: 'Forbiddon error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['403']
						}
					}
				},
				'418': {
					description: 'I\'m Ai',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['418']
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
				} : {}),
				'500': {
					description: 'Internal server error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['500']
						}
					}
				},
			}
		};

		spec.paths['/' + endpoint.name] = {
			post: info
		};
	}

	return spec;
}
