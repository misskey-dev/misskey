import { IEndpointMeta } from './endpoints.types';
import { localUsernameSchema, passwordSchema } from './schemas/user';

export const endpoints = {
    'admin/accounts/create': {
        tags: ['admin'],
        defines: [{
            req: {
                type: 'object',
                properties: {
                    username: localUsernameSchema,
                    password: passwordSchema,
                },
                required: ['username', 'password'],
            },
            res: {
				allOf: [{
					$ref: 'https://misskey-hub.net/api/schemas/MeDetailed',
				}, {
					type: 'object',
					properties: {
						token: {
							type: 'string',
						},
					},
					required: ['token'],
				}],
            },
        }],
    },
    'admin/accounts/delete': {
        tags: ['admin'],
    
        requireCredential: true,
        requireAdmin: true,
        defines: [{
            req: {
                type: 'object',
                properties: {
                    userId: { type: 'string', format: 'misskey:id' },
                },
                required: ['userId'],
            },
            res: undefined,
        }],
    },
	'admin/ad/create': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					url: { type: 'string', minLength: 1 },
					memo: { type: 'string' },
					place: { type: 'string' },
					priority: { type: 'string' },
					ratio: { type: 'integer' },
					expiresAt: { type: 'integer' },
					startsAt: { type: 'integer' },
					imageUrl: { type: 'string', minLength: 1 },
				},
				required: ['url', 'memo', 'place', 'priority', 'ratio', 'expiresAt', 'startsAt', 'imageUrl'],
			},
			res: undefined,
		}]
	},
	'admin/ad/delete': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchAd: {
				message: 'No such ad.',
				code: 'NO_SUCH_AD',
				id: 'ccac9863-3a03-416e-b899-8a64041118b1',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
				},
				required: ['id'],
			},
			res: undefined,
		}],
	},
	'admin/ad/list': {
		tags: ['admin'],
	
		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Ad',
				},
			},
		}],
	},
	'admin/ad/update': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchAd: {
				message: 'No such ad.',
				code: 'NO_SUCH_AD',
				id: 'b7aa1727-1354-47bc-a182-3a9c3973d300',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
					memo: { type: 'string' },
					url: { type: 'string', minLength: 1 },
					imageUrl: { type: 'string', minLength: 1 },
					place: { type: 'string' },
					priority: { type: 'string' },
					ratio: { type: 'integer' },
					expiresAt: { type: 'integer' },
					startsAt: { type: 'integer' },
				},
				required: ['id', 'memo', 'url', 'imageUrl', 'place', 'priority', 'ratio', 'expiresAt', 'startsAt'],
			},
			res: undefined,
		}],
	},
	'admin/announcements/create': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					title: { type: 'string', minLength: 1 },
					text: { type: 'string', minLength: 1 },
					imageUrl: {
						oneOf: [
							{ type: 'string', minLength: 1 },
							{ type: 'null' },
						],
					},
				},
				required: ['title', 'text', 'imageUrl'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Announcement',
			},
		}],
	},
	'admin/announcements/delete': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchAnnouncement: {
				message: 'No such announcement.',
				code: 'NO_SUCH_ANNOUNCEMENT',
				id: 'ecad8040-a276-4e85-bda9-015a708d291e',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
				},
				required: ['id'],
			},
			res: undefined,
		}],
	},
	'admin/announcements/list': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Announcement',
				},
			},
		}],
	},
	'admin/announcements/update': {
		tags: ['admin'],
	
		requireCredential: true,
		requireModerator: true,
	
		errors: {
			noSuchAnnouncement: {
				message: 'No such announcement.',
				code: 'NO_SUCH_ANNOUNCEMENT',
				id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
					title: { type: 'string', minLength: 1 },
					text: { type: 'string', minLength: 1 },
					imageUrl: {
						oneOf: [
							{ type: 'string', minLength: 1 },
							{ type: 'null' },
						],
					},
				},
				required: ['id', 'title', 'text', 'imageUrl'],
			},
			res: undefined,
		}],
	},
	'admin/drive/clean-remote-files': {
		tags: ['admin'],
	
		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: undefined,
		}],
	},
	'admin/drive/cleanup': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: undefined,
		}],
	},
	'admin/drive/files': {
		tags: ['admin'],
	
		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					userId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					type: {
						oneOf: [
							{ type: 'string', pattern: /^[a-zA-Z0-9\/\-*]+$/.toString().slice(1, -1) },
							{ type: 'null' },
						],
					},
					origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
					hostname: {
						oneOf: [
							{
								type: 'string',
								default: null,
								description: 'The local host is represented with `null`.',
							},
							{ type: 'null' },
						],
					},
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
				},
			},
		}],
	},
	'admin/drive/show-file': {
		tags: ['admin'],
	
		requireCredential: true,
		requireModerator: true,
	
		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					fileId: { type: 'string', format: 'misskey:id' },
					url: { type: 'string' },
				},
				anyOf: [
					{ required: ['fileId'] },
					{ required: ['url'] },
				],
			},
			res: {
				type: 'object',
				properties: {
					id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
					createdAt: { type: 'string', format: 'date-time' },
					userId: { 
						oneOf: [
							{ $ref: 'https://misskey-hub.net/api/schemas/Id' },
							{ type: 'null' },
						]
					},
					userHost: { type: ['string', 'null'] },
					md5: { type: 'string', format: 'md5', examples: '1bc29b36f623ba82aaf6724fd3b16718' },
					name: { type: 'string', examples: 'lenna.jpg' },
					type: { type: 'string', examples: 'image/jpeg' },
					size: { type: 'number', examples: 51469 },
					comment: { type: ['string', 'null'] },
					blurhash: { type: ['string', 'null'] },
					properties: { type: 'object' },
					storedInternal: { type: ['boolean', 'null'], examples: true },
					url: {
						oneOf: [
							{ type: 'string', format: 'url' },
							{ type: 'null' },
						],
					},
					thumbnailUrl: {
						oneOf: [
							{ type: 'string', format: 'url' },
							{ type: 'null' },
						],
					},
					webpublicUrl: {
						oneOf: [
							{ type: 'string', format: 'url' },
							{ type: 'null' },
						],
					},
					accessKey: { type: ['string', 'null'] },
					thumbnailAccessKey: { type: ['string', 'null'] },
					webpublicAccessKey: { type: ['string', 'null'] },
					uri: { type: ['string', 'null'] },
					src: { type: ['string', 'null'] },
					folderId: {
						oneOf: [
							{ $ref: 'https://misskey-hub.net/api/schemas/Id' },
							{ type: 'null' },
						]
					},
					isSensitive: { type: 'boolean' },
					isLink: { type: 'boolean' },
					requestIp: {
						type: ['string', 'null'],
					},
					requestHeaders: {
						oneOf: [{
							type: 'object',
						}, {
							type: 'null',
						}],
					}
				},
				required: [
					'id',
					'createdAt',
					'userId',
					'userHost',
					'md5',
					'name',
					'type',
					'size',
					'comment',
					'blurhash',
					'properties',
					'storedInternal',
					'url',
					'thumbnailUrl',
					'webpublicUrl',
					'accessKey',
					'thumbnailAccessKey',
					'webpublicAccessKey',
					'uri',
					'src',
					'folderId',
					'isSensitive',
					'isLink',
					'requestIp',
					'requestHeaders',
				],
			},
		}],
	},
	'admin/emoji/add-aliases-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: { type: 'array', items: {
						type: 'string', format: 'misskey:id',
					} },
					aliases: { type: 'array', items: {
						type: 'string',
					} },
				},
				required: ['ids', 'aliases'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/add': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
					fileId: { type: 'string', format: 'misskey:id' },
					category: {
						type: ['string', 'null'],
						description: 'Use `null` to reset the category.',
					},
					aliases: { type: 'array', items: {
						type: 'string',
					} },
					license: { type: ['string', 'null'] },
					isSensitive: { type: 'boolean' },
					localOnly: { type: 'boolean' },
					roleIdsThatCanBeUsedThisEmojiAsReaction: { type: 'array', items: {
						type: 'string',
					} },
				},
				required: ['name', 'fileId'],
			},
			res: {
				type: 'object',
				properties: {
					id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				},
				required: ['id'],
			},
		}],
	},
	'admin/emoji/copy': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		errors: {
			noSuchEmoji: {
				message: 'No such emoji.',
				code: 'NO_SUCH_EMOJI',
				id: 'e2785b66-dca3-4087-9cac-b93c541cc425',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					emojiId: { type: 'string', format: 'misskey:id' },
				},
				required: ['emojiId'],
			},
			res: {
				type: 'object',
				properties: {
					id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				},
				required: ['id'],
			}
		}],
	},
	'admin/emoji/delete-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: { type: 'array', items: {
						type: 'string', format: 'misskey:id',
					} },
				},
				required: ['ids'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/delete': {
		tags: ['admin'],
	
		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',
	
		errors: {
			noSuchEmoji: {
				message: 'No such emoji.',
				code: 'NO_SUCH_EMOJI',
				id: 'be83669b-773a-44b7-b1f8-e5e5170ac3c2',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
				},
				required: ['id'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/import-zip': {
		secure: true,
		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					fileId: { type: 'string', format: 'misskey:id' },
				},
				required: ['fileId'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/list-remote': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					query: { type: ['string', 'null'], default: null },
					host: {
						type: ['string', 'null'],
						default: null,
						description: 'Use `null` to represent the local host.',
					},
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/EmojiDetailed',
				},
			},
		}],
	},
	'admin/emoji/list': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					query: { type: ['string', 'null'], default: null },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/EmojiDetailed',
				},
			}
		}],
	},
} as const satisfies { [x: string]: IEndpointMeta; };

export function getEndpointSchema(reqres: 'req' | 'res', key: keyof typeof endpoints) {
	const endpoint = endpoints[key];
	const schemas = endpoint.defines.map(d => d[reqres]).filter(d => d !== undefined);
	if (schemas.length === 0) {
		return null;
	}
	if (schemas.length === 1) {
		return schemas[0];
	}
	return {
		oneOf: schemas,
	};
}
