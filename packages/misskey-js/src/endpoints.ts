import type { JSONSchema7 } from 'schema-type';
import { IEndpointMeta } from './endpoints.types.js';
import { localUsernameSchema, passwordSchema } from './schemas/user.js';
import ms from 'ms';
import { chartSchemaToJSONSchema } from './schemas.js';
import { chartsSchemas } from './schemas/charts.js';

export const endpoints = {
	//#region admin
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
		}],
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
						],
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
						],
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
					},
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
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
					aliases: {
						type: 'array', items: {
							type: 'string',
						}
					},
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
					aliases: {
						type: 'array', items: {
							type: 'string',
						}
					},
					license: { type: ['string', 'null'] },
					isSensitive: { type: 'boolean' },
					localOnly: { type: 'boolean' },
					roleIdsThatCanBeUsedThisEmojiAsReaction: {
						type: 'array', items: {
							type: 'string',
						}
					},
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
			},
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
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
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
			},
		}],
	},
	'admin/emoji/remove-aliases-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
					aliases: {
						type: 'array', items: {
							type: 'string',
						}
					},
				},
				required: ['ids', 'aliases'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/set-aliases-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
					aliases: {
						type: 'array', items: {
							type: 'string',
						}
					},
				},
				required: ['ids', 'aliases'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/set-category-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
					category: {
						type: ['string', 'null'],
						description: 'Use `null` to reset the category.',
					},
				},
				required: ['ids'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/set-license-bulk': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		defines: [{
			req: {
				type: 'object',
				properties: {
					ids: {
						type: 'array', items: {
							type: 'string', format: 'misskey:id',
						}
					},
					license: {
						type: ['string', 'null'],
						description: 'Use `null` to reset the license.',
					},
				},
				required: ['ids'],
			},
			res: undefined,
		}],
	},
	'admin/emoji/update': {
		tags: ['admin'],

		requireCredential: true,
		requireRolePolicy: 'canManageCustomEmojis',

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: '14fb9fd9-0731-4e2f-aeb9-f09e4740333d',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'misskey:id' },
					name: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
					fileId: { type: 'string', format: 'misskey:id' },
					category: {
						type: ['string', 'null'],
						description: 'Use `null` to reset the category.',
					},
					aliases: {
						type: 'array', items: {
							type: 'string',
						}
					},
					license: { type: ['string', 'null'] },
					isSensitive: { type: 'boolean' },
					localOnly: { type: 'boolean' },
					roleIdsThatCanBeUsedThisEmojiAsReaction: {
						type: 'array', items: {
							type: 'string',
						}
					},
				},
				required: ['id', 'name', 'aliases'],
			},
			res: undefined,
		}],
	},
	'admin/federation/delete-all-files': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
				},
				required: ['host'],
			},
			res: undefined,
		}],
	},
	'admin/federation/refresh-remote-instance-metadata': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
				},
				required: ['host'],
			},
			res: undefined,
		}],
	},
	'admin/federation/remove-all-following': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
				},
				required: ['host'],
			},
			res: undefined,
		}],
	},
	'admin/federation/update-instance': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
					isSuspended: { type: 'boolean' },
				},
				required: ['host', 'isSuspended'],
			},
			res: undefined,
		}],
	},
	'admin/promo/create': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchNote: {
				message: 'No such note.',
				code: 'NO_SUCH_NOTE',
				id: 'ee449fbe-af2a-453b-9cae-cf2fe7c895fc',
			},

			alreadyPromoted: {
				message: 'The note has already promoted.',
				code: 'ALREADY_PROMOTED',
				id: 'ae427aa2-7a41-484f-a18c-2c1104051604',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					noteId: { type: 'string', format: 'misskey:id' },
					expiresAt: { type: 'integer' },
				},
				required: ['noteId', 'expiresAt'],
			},
			res: undefined,
		}],
	},
	'admin/queue/clear': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: undefined,
		}],
	},
	'admin/queue/deliver-delayed': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					type: 'array',
					items: {
						anyOf: [
							{
								type: 'string',
							},
							{
								type: 'number',
							},
						],
					},
				},
				examples: [[
					'example.com',
					12,
				]],
			},
		}],
	},
	'admin/queue/inbox-delayed': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					type: 'array',
					items: {
						anyOf: [
							{
								type: 'string',
							},
							{
								type: 'number',
							},
						],
					},
				},
				examples: [[
					'example.com',
					12,
				]],
			},
		}],
	},
	'admin/queue/promote': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					type: { type: 'string', enum: ['deliver', 'inbox'] },
				},
				required: ['type'],
			},
			res: undefined,
		}],
	},
	'admin/queue/stats': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: {
				type: 'object',
				properties: {
					deliver: { $ref: 'https://misskey-hub.net/api/schemas/QueueCount' },
					inbox: { $ref: 'https://misskey-hub.net/api/schemas/QueueCount' },
					db: { $ref: 'https://misskey-hub.net/api/schemas/QueueCount' },
					objectStorage: { $ref: 'https://misskey-hub.net/api/schemas/QueueCount' },
				},
				required: ['deliver', 'inbox', 'db', 'objectStorage'],
			}
		}],
	},
	'admin/relays/add': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			invalidUrl: {
				message: 'Invalid URL',
				code: 'INVALID_URL',
				id: 'fb8c92d3-d4e5-44e7-b3d4-800d5cef8b2c',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					inbox: { type: 'string' },
				},
				required: ['inbox'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Relay',
			},
		}],
	},
	'admin/relays/list': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Relay',
				},
			},
		}],
	},
	'admin/relays/remove': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					inbox: { type: 'string' },
				},
				required: ['inbox'],
			},
			res: undefined,
		}],
	},
	'admin/roles/assign': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: '6503c040-6af4-4ed9-bf07-f2dd16678eab',
			},

			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '558ea170-f653-4700-94d0-5a818371d0df',
			},

			accessDenied: {
				message: 'Only administrators can edit members of the role.',
				code: 'ACCESS_DENIED',
				id: '25b5bc31-dc79-4ebd-9bd2-c84978fd052c',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
					userId: { type: 'string', format: 'misskey:id' },
					expiresAt: {
						type: ['integer', 'null'],
					},
				},
				required: [
					'roleId',
					'userId',
				],
			},
			res: undefined,
		}],
	},
	'admin/roles/create': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireAdmin: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					description: { type: 'string' },
					color: { type: ['string', 'null'] },
					iconUrl: { type: ['string', 'null'] },
					target: { type: 'string', enum: ['manual', 'conditional'] },
					condFormula: { type: 'object' },
					isPublic: { type: 'boolean' },
					isModerator: { type: 'boolean' },
					isAdministrator: { type: 'boolean' },
					isExplorable: { type: 'boolean', default: false }, // optional for backward compatibility
					asBadge: { type: 'boolean' },
					canEditMembersByModerator: { type: 'boolean' },
					displayOrder: { type: 'number' },
					policies: {
						type: 'object',
					},
				},
				required: [
					'name',
					'description',
					'color',
					'iconUrl',
					'target',
					'condFormula',
					'isPublic',
					'isModerator',
					'isAdministrator',
					'asBadge',
					'canEditMembersByModerator',
					'displayOrder',
					'policies',
				],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Role',
			},
		}],
	},
	'admin/roles/delete': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireAdmin: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: 'de0d6ecd-8e0a-4253-88ff-74bc89ae3d45',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
				},
				required: [
					'roleId',
				],
			},
			res: undefined,
		}],
	},
	'admin/roles/list': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Role',
				},
			},
		}],
	},
	'admin/roles/show': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: '07dc7d34-c0d8-49b7-96c6-db3ce64ee0b3',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
				},
				required: [
					'roleId',
				],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Role',
			}
		}],
	},
	'admin/roles/unassign': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireModerator: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: '6e519036-a70d-4c76-b679-bc8fb18194e2',
			},

			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '2b730f78-1179-461b-88ad-d24c9af1a5ce',
			},

			notAssigned: {
				message: 'Not assigned.',
				code: 'NOT_ASSIGNED',
				id: 'b9060ac7-5c94-4da4-9f55-2047c953df44',
			},

			accessDenied: {
				message: 'Only administrators can edit members of the role.',
				code: 'ACCESS_DENIED',
				id: '24636eee-e8c1-493e-94b2-e16ad401e262',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: [
					'roleId',
					'userId',
				],
			},
			res: undefined,
		}],
	},
	'admin/roles/update-default-policies': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireAdmin: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					policies: {
						type: 'object',
					},
				},
				required: [
					'policies',
				],
			},
			res: undefined,
		}],
	},
	'admin/roles/update': {
		tags: ['admin', 'role'],

		requireCredential: true,
		requireAdmin: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: 'cd23ef55-09ad-428a-ac61-95a45e124b32',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
					name: { type: 'string' },
					description: { type: 'string' },
					color: { type: ['string', 'null'] },
					iconUrl: { type: ['string', 'null'] },
					target: { type: 'string', enum: ['manual', 'conditional'] },
					condFormula: { type: 'object' },
					isPublic: { type: 'boolean' },
					isModerator: { type: 'boolean' },
					isAdministrator: { type: 'boolean' },
					isExplorable: { type: 'boolean' },
					asBadge: { type: 'boolean' },
					canEditMembersByModerator: { type: 'boolean' },
					displayOrder: { type: 'number' },
					policies: {
						type: 'object',
					},
				},
				required: [
					'roleId',
					'name',
					'description',
					'color',
					'iconUrl',
					'target',
					'condFormula',
					'isPublic',
					'isModerator',
					'isAdministrator',
					'asBadge',
					'canEditMembersByModerator',
					'displayOrder',
					'policies',
				],
			},
			res: undefined,
		}],
	},
	'admin/roles/users': {
		tags: ['admin', 'role', 'users'],

		requireCredential: false,
		requireAdmin: true,

		errors: {
			noSuchRole: {
				message: 'No such role.',
				code: 'NO_SUCH_ROLE',
				id: '224eff5e-2488-4b18-b3e7-f50d94421648',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					roleId: { type: 'string', format: 'misskey:id' },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: ['roleId'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/RoleAssign'
				},
			}
		}],
	},
	'admin/abuse-user-reports': {
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
					state: { type: ['string', 'null'], default: null },
					reporterOrigin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'combined' },
					targetUserOrigin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'combined' },
					forwarded: { type: 'boolean', default: false },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/AbuseUserReport',
				},
			},
		}],
	},
	'admin/delete-account': {
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
	'admin/delete-all-files-of-a-user': {
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
	'admin/get-index-stats': {
		requireCredential: true,
		requireAdmin: true,

		tags: ['admin'],

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						tablename: { type: 'string' },
						indexname: { type: 'string' },
					},
					required: ['tablename', 'indexname'],
				},
			},
		}],
	},
	'admin/get-table-stats': {
		requireCredential: true,
		requireAdmin: true,

		tags: ['admin'],

		defines: [{
			req: undefined,
			res: {
				type: 'object',
				additionalProperties: {
					type: 'object',
					properties: {
						count: { type: 'number' },
						size: { type: 'number' },
					},
					required: ['count', 'size'],
				},
			},
		}],
	},
	'admin/get-user-ips': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						ip: { type: 'string' },
						createdAt: { type: 'string', format: 'date-time' },
					},
					required: ['ip', 'createdAt'],
				},
			},
		}],
	},
	'admin/meta': {
		tags: ['meta'],

		requireCredential: true,
		requireAdmin: true,

		defines: [{
			req: undefined,
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/InstanceMetaAdmin',
			},
		}],
	},
	'admin/reset-password': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				type: 'object',
				properties: {
					password: {
						type: 'string',
						minLength: 8,
						maxLength: 8,
					},
				},
				required: ['password'],
			},
		}],
	},
	'admin/resolve-abuse-user-report': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					reportId: { type: 'string', format: 'misskey:id' },
					forward: { type: 'boolean', default: false },
				} as const satisfies Record<string, JSONSchema7>,
				required: ['reportId'],
			},
			res: undefined,
		}],
	},
	'admin/send-email': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					to: { type: 'string' },
					subject: { type: 'string' },
					text: { type: 'string' },
				},
				required: ['to', 'subject', 'text'],
			},
			res: undefined,
		}],
	},
	'admin/server-info': {
		requireCredential: true,
		requireModerator: true,

		tags: ['admin', 'meta'],

		defines: [{
			req: undefined,
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/ServerInfoAdmin',
			}
		}],
	},
	'admin/show-moderation-logs': {
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
				} as const satisfies Record<string, JSONSchema7>,
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/ModerationLog',
				},
			}
		}],
	},
	'admin/show-user': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				type: 'object',
				properties: {
					email: { type: ['string', 'null'] },
					emailVerified: { type: 'boolean' },
					autoAcceptFollowed: { type: 'boolean' },
					noCrawle: { type: 'boolean' },
					preventAiLearning: { type: 'boolean' },
					alwaysMarkNsfw: { type: 'boolean' },
					autoSensitive: { type: 'boolean' },
					carefulBot: { type: 'boolean' },
					injectFeaturedNote: { type: 'boolean' },
					receiveAnnouncementEmail: { type: 'boolean' },
					mutedWords: {
						type: 'array',
						items: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
					},
					mutedInstances: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					mutingNotificationTypes: {
						type: 'array',
						items: {
							$ref: 'https://misskey-hub.net/api/schemas/NotificationType',
						},
					},
					isModerator: { type: 'boolean' },
					isSilenced: { type: 'boolean' },
					isSuspended: { type: 'boolean' },
					lastActiveDate: {
						oneOf: [{
							type: 'string',
							format: 'date-time',
						}, {
							type: 'null',
						}],
					},
					moderationNote: { type: 'string' },
					signins: {
						type: 'array',
						items: {
							$ref: 'https://misskey-hub.net/api/schemas/SignIn',
						}
					},
					policies: {
						type: 'object',
					},
					roles: {
						type: 'array',
						items: {
							$ref: 'https://misskey-hub.net/api/schemas/Role',
						}
					},
				} as const satisfies Record<string, JSONSchema7>,
				required: [
					'email',
					'emailVerified',
					'autoAcceptFollowed',
					'noCrawle',
					'preventAiLearning',
					'alwaysMarkNsfw',
					'autoSensitive',
					'carefulBot',
					'injectFeaturedNote',
					'receiveAnnouncementEmail',
					'mutedWords',
					'mutedInstances',
					'mutingNotificationTypes',
					'isModerator',
					'isSilenced',
					'isSuspended',
					'lastActiveDate',
					'moderationNote',
					'signins',
					'policies',
					'roles',
				],
			}
		}],
	},
	'admin/show-users': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					offset: { type: 'integer', default: 0 },
					sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt', '+lastActiveDate', '-lastActiveDate'] },
					state: { type: 'string', enum: ['all', 'alive', 'available', 'admin', 'moderator', 'adminOrModerator', 'suspended'], default: 'all' },
					origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'combined' },
					username: { type: ['string', 'null'], default: null },
					hostname: {
						type: ['string', 'null'],
						default: null,
						description: 'The local host is represented with `null`.',
					},
				} as const satisfies Record<string, JSONSchema7>,
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/UserDetailed',
				},
			},
		}],
	},
	'admin/suspend-user': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

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
	'admin/unsuspend-user': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

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
	'admin/update-meta': {
		tags: ['admin'],

		requireCredential: true,
		requireAdmin: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					disableRegistration: { type: ['boolean', 'null'] },
					pinnedUsers: {
						oneOf: [{
							type: 'array',
							items: { type: 'string', format: 'misskey:id' },
						}, {
							type: 'null',
						}],
					},
					hiddenTags: {
						oneOf: [{
							type: 'array',
							items: { type: 'string' },
						}, {
							type: 'null',
						}],
					},
					blockedHosts: {
						oneOf: [{
							type: 'array',
							items: { type: 'string' },
						}, {
							type: 'null',
						}],
					},
					sensitiveWords: {
						oneOf: [{
							type: 'array',
							items: { type: 'string' },
						}, {
							type: 'null',
						}],
					},
					themeColor: {
						oneOf: [
							{ type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
							{ type: 'null' },
						],
					},
					mascotImageUrl: { type: ['string', 'null'] },
					bannerUrl: { type: ['string', 'null'] },
					serverErrorImageUrl: { type: ['string', 'null'] },
					notFoundImageUrl: { type: ['string', 'null'] },
					infoImageUrl: { type: ['string', 'null'] },
					iconUrl: { type: ['string', 'null'] },
					backgroundImageUrl: { type: ['string', 'null'] },
					logoImageUrl: { type: ['string', 'null'] },
					name: { type: ['string', 'null'] },
					description: { type: ['string', 'null'] },
					defaultLightTheme: { type: ['string', 'null'] },
					defaultDarkTheme: { type: ['string', 'null'] },
					cacheRemoteFiles: { type: 'boolean' },
					emailRequiredForSignup: { type: 'boolean' },
					enableHcaptcha: { type: 'boolean' },
					hcaptchaSiteKey: { type: ['string', 'null'] },
					hcaptchaSecretKey: { type: ['string', 'null'] },
					enableRecaptcha: { type: 'boolean' },
					recaptchaSiteKey: { type: ['string', 'null'] },
					recaptchaSecretKey: { type: ['string', 'null'] },
					enableTurnstile: { type: 'boolean' },
					turnstileSiteKey: { type: ['string', 'null'] },
					turnstileSecretKey: { type: ['string', 'null'] },
					sensitiveMediaDetection: { enum: ['none', 'all', 'local', 'remote'] },
					sensitiveMediaDetectionSensitivity: { enum: ['medium', 'low', 'high', 'veryLow', 'veryHigh'] },
					setSensitiveFlagAutomatically: { type: 'boolean' },
					enableSensitiveMediaDetectionForVideos: { type: 'boolean' },
					proxyAccountId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					maintainerName: { type: ['string', 'null'] },
					maintainerEmail: { type: ['string', 'null'] },
					langs: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					summalyProxy: { type: ['string', 'null'] },
					deeplAuthKey: { type: ['string', 'null'] },
					deeplIsPro: { type: 'boolean' },
					enableEmail: { type: 'boolean' },
					email: { type: ['string', 'null'] },
					smtpSecure: { type: 'boolean' },
					smtpHost: { type: ['string', 'null'] },
					smtpPort: { type: ['integer', 'null'] },
					smtpUser: { type: ['string', 'null'] },
					smtpPass: { type: ['string', 'null'] },
					enableServiceWorker: { type: 'boolean' },
					swPublicKey: { type: ['string', 'null'] },
					swPrivateKey: { type: ['string', 'null'] },
					tosUrl: { type: ['string', 'null'] },
					repositoryUrl: { type: 'string' },
					feedbackUrl: { type: 'string' },
					useObjectStorage: { type: 'boolean' },
					objectStorageBaseUrl: { type: ['string', 'null'] },
					objectStorageBucket: { type: ['string', 'null'] },
					objectStoragePrefix: { type: ['string', 'null'] },
					objectStorageEndpoint: { type: ['string', 'null'] },
					objectStorageRegion: { type: ['string', 'null'] },
					objectStoragePort: { type: ['integer', 'null'] },
					objectStorageAccessKey: { type: ['string', 'null'] },
					objectStorageSecretKey: { type: ['string', 'null'] },
					objectStorageUseSSL: { type: 'boolean' },
					objectStorageUseProxy: { type: 'boolean' },
					objectStorageSetPublicRead: { type: 'boolean' },
					objectStorageS3ForcePathStyle: { type: 'boolean' },
					enableIpLogging: { type: 'boolean' },
					enableActiveEmailValidation: { type: 'boolean' },
					enableChartsForRemoteUser: { type: 'boolean' },
					enableChartsForFederatedInstances: { type: 'boolean' },
					enableServerMachineStats: { type: 'boolean' },
					enableIdenticonGeneration: { type: 'boolean' },
					serverRules: { type: 'array', items: { type: 'string' } },
					preservedUsernames: { type: 'array', items: { type: 'string' } },
				} as const satisfies Record<string, JSONSchema7>,
				required: [],
			},
			res: undefined,
		}],
	},
	'admin/update-user-note': {
		tags: ['admin'],

		requireCredential: true,
		requireModerator: true,

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
					text: { type: 'string' },
				},
				required: ['userId', 'text'],
			},
			res: undefined,
		}],
	},
	//#endregion

	//#region antenna
	'antenna/create': {
		tags: ['antennas'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		errors: {
			noSuchUserList: {
				message: 'No such user list.',
				code: 'NO_SUCH_USER_LIST',
				id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
			},

			tooManyAntennas: {
				message: 'You cannot create antenna any more.',
				code: 'TOO_MANY_ANTENNAS',
				id: 'faf47050-e8b5-438c-913c-db2b1576fde4',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					src: { type: 'string', enum: ['home', 'all', 'users', 'list'] },
					userListId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					keywords: {
						type: 'array', items: {
							type: 'array', items: {
								type: 'string',
							},
						}
					},
					excludeKeywords: {
						type: 'array', items: {
							type: 'array', items: {
								type: 'string',
							},
						}
					},
					users: {
						type: 'array', items: {
							type: 'string',
						}
					},
					caseSensitive: { type: 'boolean' },
					withReplies: { type: 'boolean' },
					withFile: { type: 'boolean' },
					notify: { type: 'boolean' },
				},
				required: ['name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile', 'notify'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Antenna',
			},
		}],
	},
	'antennas/delete': {
		tags: ['antennas'],

		requireCredential: true,

		kind: 'write:account',

		errors: {
			noSuchAntenna: {
				message: 'No such antenna.',
				code: 'NO_SUCH_ANTENNA',
				id: 'b34dcf9d-348f-44bb-99d0-6c9314cfe2df',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					antennaId: { type: 'string', format: 'misskey:id' },
				},
				required: ['antennaId'],
			},
			res: undefined,
		}],
	},
	'antennas/list': {
		tags: ['antennas', 'account'],

		requireCredential: true,

		kind: 'read:account',

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Antenna',
				},
			},
		}],
	},
	'antennas/notes': {
		tags: ['antennas', 'account', 'notes'],

		requireCredential: true,

		kind: 'read:account',

		errors: {
			noSuchAntenna: {
				message: 'No such antenna.',
				code: 'NO_SUCH_ANTENNA',
				id: '850926e0-fd3b-49b6-b69a-b28a5dbd82fe',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					antennaId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					sinceDate: { type: 'integer' },
					untilDate: { type: 'integer' },
				},
				required: ['antennaId'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Note',
				},
			},
		}],
	},
	'antennas/show': {
		tags: ['antennas', 'account'],

		requireCredential: true,

		kind: 'read:account',

		errors: {
			noSuchAntenna: {
				message: 'No such antenna.',
				code: 'NO_SUCH_ANTENNA',
				id: 'c06569fb-b025-4f23-b22d-1fcd20d2816b',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					antennaId: { type: 'string', format: 'misskey:id' },
				},
				required: ['antennaId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Antenna',
			},
		}],
	},
	'antennas/update': {
		tags: ['antennas'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		errors: {
			noSuchAntenna: {
				message: 'No such antenna.',
				code: 'NO_SUCH_ANTENNA',
				id: '10c673ac-8852-48eb-aa1f-f5b67f069290',
			},

			noSuchUserList: {
				message: 'No such user list.',
				code: 'NO_SUCH_USER_LIST',
				id: '1c6b35c9-943e-48c2-81e4-2844989407f7',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					antennaId: { type: 'string', format: 'misskey:id' },
					name: { type: 'string', minLength: 1, maxLength: 100 },
					src: { type: 'string', enum: ['home', 'all', 'users', 'list'] },
					userListId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					keywords: {
						type: 'array', items: {
							type: 'array', items: {
								type: 'string',
							},
						}
					},
					excludeKeywords: {
						type: 'array', items: {
							type: 'array', items: {
								type: 'string',
							},
						}
					},
					users: {
						type: 'array', items: {
							type: 'string',
						}
					},
					caseSensitive: { type: 'boolean' },
					withReplies: { type: 'boolean' },
					withFile: { type: 'boolean' },
					notify: { type: 'boolean' },
				},
				required: ['antennaId', 'name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile', 'notify'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Antenna',
			},
		}],
	},
	//#endregion

	//#region ap
	'ap/get': {
		tags: ['federation'],

		requireCredential: true,

		limit: {
			duration: ms('1hour'),
			max: 30,
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					uri: { type: 'string' },
				},
				required: ['uri'],
			},
			res: {
				type: 'object',
			},
		}],
	},
	'ap/show': {
		tags: ['federation'],

		requireCredential: true,

		limit: {
			duration: ms('1hour'),
			max: 30,
		},

		errors: {
			noSuchObject: {
				message: 'No such object.',
				code: 'NO_SUCH_OBJECT',
				id: 'dc94d745-1262-4e63-a17d-fecaa57efc82',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					uri: { type: 'string' },
				},
				required: ['uri'],
			},
			res: {
				oneOf: [
					{
						type: 'object',
						properties: {
							type: { const: 'User' },
							object: {
								$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
							},
						},
						required: ['type', 'object'],
					},
					{
						type: 'object',
						properties: {
							type: { const: 'Note' },
							object: {
								$ref: 'https://misskey-hub.net/api/schemas/Note',
							},
						},
						required: ['type', 'object'],
					},
				],
			},
		}],
	},
	//#endregion

	//#region app
	'app/create': {
		tags: ['app'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					description: { type: 'string' },
					permission: {
						type: 'array',
						uniqueItems: true,
						items: {
							type: 'string',
						},
					},
					callbackUrl: { type: ['string', 'null'] },
				} as const satisfies Record<string, JSONSchema7>,
				required: ['name', 'description', 'permission'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/App',
			},
		}],
	},
	'app/show': {
		tags: ['app'],

		errors: {
			noSuchApp: {
				message: 'No such app.',
				code: 'NO_SUCH_APP',
				id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					appId: { type: 'string', format: 'misskey:id' },
				},
				required: ['appId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/App',
			},
		}],
	},
	//#endregion

	//#region auth
	'auth/session/genrate': {
		tags: ['auth'],

		requireCredential: false,

		errors: {
			noSuchApp: {
				message: 'No such app.',
				code: 'NO_SUCH_APP',
				id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					appSecret: { type: 'string' },
				},
				required: ['appSecret'],
			},
			res: {
				type: 'object',
				properties: {
					token: { type: 'string' },
					url: { type: 'string', format: 'url' },
				},
				required: ['token', 'url'],
			},
		}],
	},
	'auth/session/show': {
		tags: ['auth'],

		requireCredential: false,

		errors: {
			noSuchSession: {
				message: 'No such session.',
				code: 'NO_SUCH_SESSION',
				id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					token: { type: 'string' },
				},
				required: ['token'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/AuthSession',
			},
		}],
	},
	'auth/session/userkey': {
		tags: ['auth'],

		requireCredential: false,

		errors: {
			noSuchApp: {
				message: 'No such app.',
				code: 'NO_SUCH_APP',
				id: 'fcab192a-2c5a-43b7-8ad8-9b7054d8d40d',
			},

			noSuchSession: {
				message: 'No such session.',
				code: 'NO_SUCH_SESSION',
				id: '5b5a1503-8bc8-4bd0-8054-dc189e8cdcb3',
			},

			pendingSession: {
				message: 'This session is not completed yet.',
				code: 'PENDING_SESSION',
				id: '8c8a4145-02cc-4cca-8e66-29ba60445a8e',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					appSecret: { type: 'string' },
					token: { type: 'string' },
				},
				required: ['appSecret', 'token'],
			},
			res: {
				type: 'object',
				properties: {
					accessToken: { type: 'string' },
					user: {
						$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
					},
				},
				required: ['accessToken', 'user'],
			}
		}],
	},
	'auth/accept': {
		tags: ['auth'],

		requireCredential: true,

		secure: true,

		errors: {
			noSuchSession: {
				message: 'No such session.',
				code: 'NO_SUCH_SESSION',
				id: '9c72d8de-391a-43c1-9d06-08d29efde8df',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					token: { type: 'string' },
				},
				required: ['token'],
			},
			res: undefined,
		}],
	},
	//#endregion

	//#region blocking
	'blocking/create': {
		tags: ['account'],

		limit: {
			duration: ms('1hour'),
			max: 20,
		},

		requireCredential: true,

		kind: 'write:blocks',

		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '7cc4f851-e2f1-4621-9633-ec9e1d00c01e',
			},

			blockeeIsYourself: {
				message: 'Blockee is yourself.',
				code: 'BLOCKEE_IS_YOURSELF',
				id: '88b19138-f28d-42c0-8499-6a31bbd0fdc6',
			},

			alreadyBlocking: {
				message: 'You are already blocking that user.',
				code: 'ALREADY_BLOCKING',
				id: '787fed64-acb9-464a-82eb-afbd745b9614',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
			},
		}],
	},
	'blocking/delete': {
		tags: ['account'],

		limit: {
			duration: ms('1hour'),
			max: 100,
		},

		requireCredential: true,

		kind: 'write:blocks',

		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '8621d8bf-c358-4303-a066-5ea78610eb3f',
			},

			blockeeIsYourself: {
				message: 'Blockee is yourself.',
				code: 'BLOCKEE_IS_YOURSELF',
				id: '06f6fac6-524b-473c-a354-e97a40ae6eac',
			},

			notBlocking: {
				message: 'You are not blocking that user.',
				code: 'NOT_BLOCKING',
				id: '291b2efa-60c6-45c0-9f6a-045c8f9b02cd',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
			},
		}],
	},
	'blocking/list': {
		tags: ['account'],

		requireCredential: true,

		kind: 'read:blocks',

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Blocking',
				},
			},
		}],
	},
	//#endregion

	//#region channels
	'channels/create': {
		tags: ['channels'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:channels',

		limit: {
			duration: ms('1hour'),
			max: 10,
		},

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 128 },
					description: {
						oneOf: [
							{ type: 'string', minLength: 1, maxLength: 2048 },
							{ type: 'null' },
						],
					},
					bannerId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					color: { type: 'string', minLength: 1, maxLength: 16 },
				},
				required: ['name'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Channel',
			}
		}],
	},
	'channels/favorite': {
		tags: ['channels'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:channels',

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: '4938f5f3-6167-4c04-9149-6607b7542861',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
				},
				required: ['channelId'],
			},
			res: undefined,
		}]
	},
	'channels/featured': {
		tags: ['channels'],

		requireCredential: false,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Channel',
				},
			},
		}],
	},
	'channels/follow': {
		tags: ['channels'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:channels',

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: 'c0031718-d573-4e85-928e-10039f1fbb68',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
				},
				required: ['channelId'],
			},
			res: undefined,
		}],
	},
	'channels/followed': {
		tags: ['channels', 'account'],

		requireCredential: true,

		kind: 'read:channels',

		defines: [{
			req: {
				type: 'object',
				properties: {
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 5 },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Channel',
				},
			},
		}],
	},
	'channels/my-favorites': {
		tags: ['channels', 'account'],

		requireCredential: true,

		kind: 'read:channels',

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Channel',
				},
			},
		}],
	},
	'channels/owned': {
		tags: ['channels', 'account'],

		requireCredential: true,

		kind: 'read:channels',

		defines: [{
			req: {
				type: 'object',
				properties: {
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 5 },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Channel',
				},
			},
		}],
	},
	'channels/search': {
		tags: ['channels'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					query: { type: 'string' },
					type: { type: 'string', enum: ['nameAndDescription', 'nameOnly'], default: 'nameAndDescription' },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 5 },
				},
				required: ['query'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Channel',
				},
			},
		}],
	},
	'channels/show': {
		tags: ['channels'],

		requireCredential: false,

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: '6f6c314b-7486-4897-8966-c04a66a02923',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
				},
				required: ['channelId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Channel',
			},
		}],
	},
	'channels/timeline': {
		tags: ['notes', 'channels'],

		requireCredential: false,

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: '4d0eeeba-a02c-4c3c-9966-ef60d38d2e7f',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					sinceDate: { type: 'integer' },
					untilDate: { type: 'integer' },
				},
				required: ['channelId'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Note',
				},
			},
		}],
	},
	'channels/unfavorite': {
		tags: ['channels'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:channels',

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: '353c68dd-131a-476c-aa99-88a345e83668',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
				},
				required: ['channelId'],
			},
			res: undefined,
		}],
	},
	'channels/unfollow': {
		tags: ['channels'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:channels',

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: '19959ee9-0153-4c51-bbd9-a98c49dc59d6',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
				},
				required: ['channelId'],
			},
			res: undefined,
		}],
	},
	'channels/update': {
		tags: ['channels'],

		requireCredential: true,

		kind: 'write:channels',

		errors: {
			noSuchChannel: {
				message: 'No such channel.',
				code: 'NO_SUCH_CHANNEL',
				id: 'f9c5467f-d492-4c3c-9a8d-a70dacc86512',
			},

			accessDenied: {
				message: 'You do not have edit privilege of the channel.',
				code: 'ACCESS_DENIED',
				id: '1fb7cb09-d46a-4fdf-b8df-057788cce513',
			},

			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'e86c14a4-0da2-4032-8df3-e737a04c7f3b',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					channelId: { type: 'string', format: 'misskey:id' },
					name: { type: 'string', minLength: 1, maxLength: 128 },
					description: {
						oneOf: [
							{ type: 'string', minLength: 1, maxLength: 2048 },
							{ type: 'null' },
						],
					},
					bannerId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
					isArchived: { type: ['boolean', 'true'] },
					pinnedNoteIds: {
						type: 'array',
						items: {
							type: 'string', format: 'misskey:id',
						},
					},
					color: { type: 'string', minLength: 1, maxLength: 16 },
				},
				required: ['channelId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Channel',
			},
		}],
	},
	//#endregion

	//#region charts
	'charts/user/drive': {
		tags: ['charts', 'drive', 'users'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['span', 'userId'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.perUserDrive) satisfies JSONSchema7,
		}],
	},
	'charts/user/following': {
		tags: ['charts', 'users', 'following'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['span', 'userId'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.perUserFollowing) satisfies JSONSchema7,
		}],
	},
	'charts/user/notes': {
		tags: ['charts', 'users', 'notes'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['span', 'userId'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.perUserNotes) satisfies JSONSchema7,
		}],
	},
	'charts/user/pv': {
		tags: ['charts', 'users'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['span', 'userId'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.perUserPv) satisfies JSONSchema7,
		}],
	},
	'charts/user/reactions': {
		tags: ['charts', 'users', 'reactions'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['span', 'userId'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.perUserReactions) satisfies JSONSchema7,
		}],
	},
	'charts/active-users': {
		tags: ['charts', 'users'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.activeUsers) satisfies JSONSchema7,
		}],
	},
	'charts/ap-request': {
		tags: ['charts'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.apRequest) satisfies JSONSchema7,
		}],
	},
	'charts/drive': {
		tags: ['charts', 'drive'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.drive) satisfies JSONSchema7,
		}],
	},
	'charts/federation': {
		tags: ['charts'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.federation) satisfies JSONSchema7,
		}],
	},
	'charts/instance': {
		tags: ['charts'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
					host: { type: 'string' },
				},
				required: ['span', 'host'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.instance) satisfies JSONSchema7,
		}],
	},
	'charts/notes': {
		tags: ['charts', 'notes'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.notes) satisfies JSONSchema7,
		}],
	},
	'charts/users': {
		tags: ['charts', 'users'],

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					span: { type: 'string', enum: ['day', 'hour'] },
					limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
					offset: { type: 'integer', nullable: true, default: null },
				},
				required: ['span'],
			},
			res: chartSchemaToJSONSchema(chartsSchemas.users) satisfies JSONSchema7,
		}],
	},
	//#endregion

	//#region clips
	'clips/add-note': {
		tags: ['account', 'notes', 'clips'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		limit: {
			duration: ms('1hour'),
			max: 20,
		},

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
			},

			noSuchNote: {
				message: 'No such note.',
				code: 'NO_SUCH_NOTE',
				id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
			},

			alreadyClipped: {
				message: 'The note has already been clipped.',
				code: 'ALREADY_CLIPPED',
				id: '734806c4-542c-463a-9311-15c512803965',
			},

			tooManyClipNotes: {
				message: 'You cannot add notes to the clip any more.',
				code: 'TOO_MANY_CLIP_NOTES',
				id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
					noteId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId', 'noteId'],
			},
			res: undefined,
		}]
	},
	'clips/create': {
		tags: ['clips'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		errors: {
			tooManyClips: {
				message: 'You cannot create clip any more.',
				code: 'TOO_MANY_CLIPS',
				id: '920f7c2d-6208-4b76-8082-e632020f5883',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					isPublic: { type: 'boolean', default: false },
					description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
				},
				required: ['name'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Clip',
			},
		}],
	},
	'clips/delete': {
		tags: ['clips'],

		requireCredential: true,

		kind: 'write:account',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: '70ca08ba-6865-4630-b6fb-8494759aa754',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId'],
			},
			res: undefined,
		}]
	},
	'clips/favorite': {
		tags: ['clip'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:clip-favorite',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: '4c2aaeae-80d8-4250-9606-26cb1fdb77a5',
			},

			alreadyFavorited: {
				message: 'The clip has already been favorited.',
				code: 'ALREADY_FAVORITED',
				id: '92658936-c625-4273-8326-2d790129256e',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId'],
			},
			res: undefined,
		}],
	},
	'clips/list': {
		tags: ['clips', 'account'],

		requireCredential: true,

		kind: 'read:account',

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Clip',
				},
			}
		}],
	},
	'clips/my-favorites': {
		tags: ['account', 'clip'],

		requireCredential: true,

		kind: 'read:clip-favorite',

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Clip',
				},
			},
		}],
	},
	'clips/notes': {
		tags: ['account', 'notes', 'clips'],

		requireCredential: false,

		kind: 'read:account',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Note',
				},
			},
		}],
	},
	'clips/remove-note': {
		tags: ['account', 'notes', 'clips'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: 'b80525c6-97f7-49d7-a42d-ebccd49cfd52',
			},

			noSuchNote: {
				message: 'No such note.',
				code: 'NO_SUCH_NOTE',
				id: 'aff017de-190e-434b-893e-33a9ff5049d8',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
					noteId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId', 'noteId'],
			},
			res: undefined,
		}],
	},
	'clips/show': {
		tags: ['clips', 'account'],

		requireCredential: false,

		kind: 'read:account',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Clip',
			},
		}],
	},
	'clips/unfavorite': {
		tags: ['clip'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:clip-favorite',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: '2603966e-b865-426c-94a7-af4a01241dc1',
			},

			notFavorited: {
				message: 'You have not favorited the clip.',
				code: 'NOT_FAVORITED',
				id: '90c3a9e8-b321-4dae-bf57-2bf79bbcc187',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
				},
				required: ['clipId'],
			},
			res: undefined,
		}]
	},
	'clips/update': {
		tags: ['clips'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:account',

		errors: {
			noSuchClip: {
				message: 'No such clip.',
				code: 'NO_SUCH_CLIP',
				id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					clipId: { type: 'string', format: 'misskey:id' },
					name: { type: 'string', minLength: 1, maxLength: 100 },
					isPublic: { type: 'boolean' },
					description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
				},
				required: ['clipId', 'name'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Clip',
			},
		}]
	},
	//#endregion

	//#region drive
	'drive/files/attached-notes': {
		tags: ['drive', 'notes'],

		requireCredential: true,

		kind: 'read:drive',

		description: 'Find the notes to which the given file is attached.',

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					fileId: { type: 'string', format: 'misskey:id' },
				},
				required: ['fileId'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Note',
				},
			},
		}],
	},
	'drive/files/check-existence': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		description: 'Check if a given file exists.',

		defines: [{
			req: {
				type: 'object',
				properties: {
					md5: { type: 'string' },
				},
				required: ['md5'],
			},
			res: {
				type: 'boolean',
			},
		}],
	},
	'drive/files/create': {
		tags: ['drive'],

		requireCredential: true,

		prohibitMoved: true,

		limit: {
			duration: ms('1hour'),
			max: 120,
		},

		requireFile: true,

		kind: 'write:drive',

		description: 'Upload a new drive file.',

		errors: {
			invalidFileName: {
				message: 'Invalid file name.',
				code: 'INVALID_FILE_NAME',
				id: 'f449b209-0c60-4e51-84d5-29486263bfd4',
			},

			inappropriate: {
				message: 'Cannot upload the file because it has been determined that it possibly contains inappropriate content.',
				code: 'INAPPROPRIATE',
				id: 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2',
			},

			noFreeSpace: {
				message: 'Cannot upload the file because you have no free space of drive.',
				code: 'NO_FREE_SPACE',
				id: 'd08dbc37-a6a9-463a-8c47-96c32ab5f064',
			},

			commentTooLong: {
				message: 'Comment is too long.',
				code: 'COMMENT_TOO_LONG',
				id: 'f0b0f2a0-0b0a-4b0a-8b0a-0b0a0b0a0b0a',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					file: { type: 'binary' },
					folderId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
						default: null,
					},
					name: { type: ['string', 'null'], default: null },
					comment: { type: ['string', 'null'], default: null },
					isSensitive: { type: 'boolean', default: false },
					force: { type: 'boolean', default: false },
				},
				required: ['file'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
			},
		}],
	},
	'drive/files/delete': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'write:drive',

		description: 'Delete an existing drive file.',

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: '908939ec-e52b-4458-b395-1025195cea58',
			},

			accessDenied: {
				message: 'Access denied.',
				code: 'ACCESS_DENIED',
				id: '5eb8d909-2540-4970-90b8-dd6f86088121',
			},
		},

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
	'drive/files/find-by-hash': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		description: 'Search for a drive file by a hash of the contents.',

		defines: [{
			req: {
				type: 'object',
				properties: {
					md5: { type: 'string' },
				},
				required: ['md5'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
				},
			},
		}],
	},
	'drive/files/find': {
		requireCredential: true,

		tags: ['drive'],

		kind: 'read:drive',

		description: 'Search for a drive file by the given parameters.',

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
				},
				required: ['name'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
				},
			},
		}],
	},
	'drive/files/show': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		description: 'Show the properties of a drive file.',

		errors: {
			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: '067bc436-2718-4795-b0fb-ecbe43949e31',
			},

			accessDenied: {
				message: 'Access denied.',
				code: 'ACCESS_DENIED',
				id: '25b73c73-68b1-41d0-bad1-381cfdf6579f',
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
				$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
			},
		}],
	},
	'drive/files/update': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'write:drive',

		description: 'Update the properties of a drive file.',

		errors: {
			invalidFileName: {
				message: 'Invalid file name.',
				code: 'INVALID_FILE_NAME',
				id: '395e7156-f9f0-475e-af89-53c3c23080c2',
			},

			noSuchFile: {
				message: 'No such file.',
				code: 'NO_SUCH_FILE',
				id: 'e7778c7e-3af9-49cd-9690-6dbc3e6c972d',
			},

			accessDenied: {
				message: 'Access denied.',
				code: 'ACCESS_DENIED',
				id: '01a53b27-82fc-445b-a0c1-b558465a8ed2',
			},

			noSuchFolder: {
				message: 'No such folder.',
				code: 'NO_SUCH_FOLDER',
				id: 'ea8fb7a5-af77-4a08-b608-c0218176cd73',
			},

			restrictedByRole: {
				message: 'This feature is restricted by your role.',
				code: 'RESTRICTED_BY_ROLE',
				id: '7f59dccb-f465-75ab-5cf4-3ce44e3282f7',
			},
		},
		defines: [{
			req: {
				type: 'object',
				properties: {
					fileId: { type: 'string', format: 'misskey:id' },
					folderId: { type: 'string', format: 'misskey:id', nullable: true },
					name: { type: 'string' },
					isSensitive: { type: 'boolean' },
					comment: {
						oneOf: [
							{ type: 'string', maxLength: 512 },
							{ type: 'null' },
						],
					},
				},
				required: ['fileId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/DriveFile',
			},
		}],
	},
	'drive/files/upload-from-url': {
		tags: ['drive'],

		limit: {
			duration: ms('1hour'),
			max: 60,
		},

		description: 'Request the server to download a new drive file from the specified URL.',

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:drive',

		defines: [{
			req: {
				type: 'object',
				properties: {
					url: { type: 'string' },
					folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
					isSensitive: { type: 'boolean', default: false },
					comment: { type: 'string', nullable: true, maxLength: 512, default: null },
					marker: { type: 'string', nullable: true, default: null },
					force: { type: 'boolean', default: false },
				},
				required: ['url'],
			},
			res: undefined,
		}],
	},
	'drive/folders/create': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'write:drive',

		limit: {
			duration: ms('1hour'),
			max: 10,
		},

		errors: {
			noSuchFolder: {
				message: 'No such folder.',
				code: 'NO_SUCH_FOLDER',
				id: '53326628-a00d-40a6-a3cd-8975105c0f95',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string', default: 'Untitled', maxLength: 200 },
					parentId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
				},
				required: [],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
			},
		}],
	},
	'drive/folders/delete': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'write:drive',

		errors: {
			noSuchFolder: {
				message: 'No such folder.',
				code: 'NO_SUCH_FOLDER',
				id: '1069098f-c281-440f-b085-f9932edbe091',
			},

			hasChildFilesOrFolders: {
				message: 'This folder has child files or folders.',
				code: 'HAS_CHILD_FILES_OR_FOLDERS',
				id: 'b0fc8a17-963c-405d-bfbc-859a487295e1',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					folderId: { type: 'string', format: 'misskey:id' },
				},
				required: ['folderId'],
			},
			res: undefined,
		}],
	},
	'drive/folders/find': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		defines: [{
			req: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					parentId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
						default: null,
					},
				},
				required: ['name'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
				},
			}
		}]
	},
	'drive/folders/show': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		errors: {
			noSuchFolder: {
				message: 'No such folder.',
				code: 'NO_SUCH_FOLDER',
				id: 'd74ab9eb-bb09-4bba-bf24-fb58f761e1e9',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					folderId: { type: 'string', format: 'misskey:id' },
				},
				required: ['folderId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
			}
		}],
	},
	'drive/folders/update': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'write:drive',

		errors: {
			noSuchFolder: {
				message: 'No such folder.',
				code: 'NO_SUCH_FOLDER',
				id: 'f7974dac-2c0d-4a27-926e-23583b28e98e',
			},

			noSuchParentFolder: {
				message: 'No such parent folder.',
				code: 'NO_SUCH_PARENT_FOLDER',
				id: 'ce104e3a-faaf-49d5-b459-10ff0cbbcaa1',
			},

			recursiveNesting: {
				message: 'It can not be structured like nesting folders recursively.',
				code: 'RECURSIVE_NESTING',
				id: 'dbeb024837894013aed44279f9199740',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					folderId: { type: 'string', format: 'misskey:id' },
					name: { type: 'string', maxLength: 200 },
					parentId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
					},
				},
				required: ['folderId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
			}
		}],
	},
	'drive/files': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					folderId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
						default: null,
					},
					type: {
						oneOf: [
							{ type: 'string', pattern: /^[a-zA-Z\/\-*]+$/.toString().slice(1, -1) },
							{ type: 'null' },
						],
						default: null,
					},
					sort: { enum: [null, '+createdAt', '-createdAt', '+name', '-name', '+size', '-size'] },
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
	'drive/folders': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					folderId: {
						oneOf: [
							{ type: 'string', format: 'misskey:id' },
							{ type: 'null' },
						],
						default: null,
					},
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
				},
			},
		}],
	},
	'drive/stream': {
		tags: ['drive'],

		requireCredential: true,

		kind: 'read:drive',

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					type: { type: 'string', pattern: /^[a-zA-Z\/\-*]+$/.toString().slice(1, -1) },
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
	//#endregion

	'email-address/available': {
		tags: ['users'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					emailAddress: { type: 'string' },
				},
				required: ['emailAddress'],
			},
			res: {
				type: 'object',
				properties: {
					available: { type: 'boolean' },
					reason: {
						enum: [null, 'used', 'format', 'disposable', 'mx', 'smtp']
					},
				},
				required: [
					'available',
					'reason',
				],
			},
		}],
	},

	//#region federation
	'federation/followers': {
		tags: ['federation'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: ['host'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Following',
				},
			}
		}],
	},
	'federation/followings': {
		tags: ['federation'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: ['host'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Following',
				},
			}
		}],
	},
	'federation/instances': {
		tags: ['federation'],

		requireCredential: false,
		allowGet: true,
		cacheSec: 3600,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: ['string', 'null'], description: 'Omit or use `null` to not filter by host.' },
					blocked: { type: ['boolean', 'null'] },
					notResponding: { type: ['boolean', 'null'] },
					suspended: { type: ['boolean', 'null'] },
					federating: { type: ['boolean', 'null'] },
					subscribing: { type: ['boolean', 'null'] },
					publishing: { type: ['boolean', 'null'] },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
					offset: { type: 'integer', default: 0 },
					sort: { type: 'string' },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/FederationInstance',
				},
			},
		}],
	},
	'federation/show-instance': {
		tags: ['federation'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
				},
				required: ['host'],
			},
			res: {
				oneOf: [{
					$ref: 'https://misskey-hub.net/api/schemas/FederationInstance',
				}, {
					type: 'null',
				}],
			}
		}]
	},
	'federation/stats': {
		tags: ['federation'],

		requireCredential: false,

		allowGet: true,
		cacheSec: 60 * 60,

		defines: [{
			req: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: [],
			},
			res: {
				type: 'object',
				properties: {
					topSubInstances: {
						type: 'array',
						items: {
							$ref: 'https://misskey-hub.net/api/schemas/FederationInstance',
						},
					},
					otherFollowersCount: {
						type: 'number',
					},
					topPubInstances: {
						type: 'array',
						items: {
							$ref: 'https://misskey-hub.net/api/schemas/FederationInstance',
						},
					},
					otherFollowingCount: {
						type: 'number',
					},
				},
				required: [
					'topSubInstances',
					'otherFollowersCount',
					'topPubInstances',
					'otherFollowingCount',
				],
			},
		}],
	},
	'federation/update-remote-user': {
		tags: ['federation'],

		requireCredential: true,

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
	'federation/users': {
		tags: ['federation'],

		requireCredential: false,

		defines: [{
			req: {
				type: 'object',
				properties: {
					host: { type: 'string' },
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: ['host'],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
				},
			},
		}],
	},
	//#endregion

	//#region flash
	'flash/create': {
		tags: ['flash'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:flash',

		limit: {
			duration: ms('1hour'),
			max: 10,
		},

		errors: {
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					summary: { type: 'string' },
					script: { type: 'string' },
					permissions: {
						type: 'array', items: {
							type: 'string',
						}
					},
				},
				required: ['title', 'summary', 'script', 'permissions'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Flash',
			},
		}],
	},
	'flash/delete': {
		tags: ['flashs'],

		requireCredential: true,

		kind: 'write:flash',

		errors: {
			noSuchFlash: {
				message: 'No such flash.',
				code: 'NO_SUCH_FLASH',
				id: 'de1623ef-bbb3-4289-a71e-14cfa83d9740',
			},

			accessDenied: {
				message: 'Access denied.',
				code: 'ACCESS_DENIED',
				id: '1036ad7b-9f92-4fff-89c3-0e50dc941704',
			},
		},
		defines: [{
			req: {
				type: 'object',
				properties: {
					flashId: { type: 'string', format: 'misskey:id' },
				},
				required: ['flashId'],
			},
			res: undefined,
		}],
	},
	'flash/featured': {
		tags: ['flash'],

		requireCredential: false,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/Flash',
				},
			},
		}],
	},
	'flash/like': {
		tags: ['flash'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:flash-likes',

		errors: {
			noSuchFlash: {
				message: 'No such flash.',
				code: 'NO_SUCH_FLASH',
				id: 'c07c1491-9161-4c5c-9d75-01906f911f73',
			},

			yourFlash: {
				message: 'You cannot like your flash.',
				code: 'YOUR_FLASH',
				id: '3fd8a0e7-5955-4ba9-85bb-bf3e0c30e13b',
			},

			alreadyLiked: {
				message: 'The flash has already been liked.',
				code: 'ALREADY_LIKED',
				id: '010065cf-ad43-40df-8067-abff9f4686e3',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					flashId: { type: 'string', format: 'misskey:id' },
				},
				required: ['flashId'],
			},
			res: undefined,
		}],
	},
	'flash/my-likes': {
		tags: ['account', 'flash'],

		requireCredential: true,

		kind: 'read:flash-likes',

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
					type: 'object',
					properties: {
						id: {
							$ref: 'https://misskey-hub.net/api/schemas/Id',
						},
						flash: {
							$ref: 'https://misskey-hub.net/api/schemas/Flash',
						},
					},
					required: ['id', 'flash'],
				},
			},
		}],
	},
	'flash/my': {
		tags: ['account', 'flash'],

		requireCredential: true,

		kind: 'read:flash',

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
					$ref: 'https://misskey-hub.net/api/schemas/Flash',
				},
			},
		}],
	},
	'flash/show': {
		tags: ['flashs'],

		requireCredential: false,

		errors: {
			noSuchFlash: {
				message: 'No such flash.',
				code: 'NO_SUCH_FLASH',
				id: 'f0d34a1a-d29a-401d-90ba-1982122b5630',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					flashId: { type: 'string', format: 'misskey:id' },
				},
				required: ['flashId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/Flash',
			},
		}],
	},
	'flash/unlike': {
		tags: ['flash'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:flash-likes',

		errors: {
			noSuchFlash: {
				message: 'No such flash.',
				code: 'NO_SUCH_FLASH',
				id: 'afe8424a-a69e-432d-a5f2-2f0740c62410',
			},

			notLiked: {
				message: 'You have not liked that flash.',
				code: 'NOT_LIKED',
				id: '755f25a7-9871-4f65-9f34-51eaad9ae0ac',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					flashId: { type: 'string', format: 'misskey:id' },
				},
				required: ['flashId'],
			},
			res: undefined,
		}],
	},
	'flash/update': {
		tags: ['flash'],

		requireCredential: true,

		prohibitMoved: true,

		kind: 'write:flash',

		limit: {
			duration: ms('1hour'),
			max: 300,
		},

		errors: {
			noSuchFlash: {
				message: 'No such flash.',
				code: 'NO_SUCH_FLASH',
				id: '611e13d2-309e-419a-a5e4-e0422da39b02',
			},

			accessDenied: {
				message: 'Access denied.',
				code: 'ACCESS_DENIED',
				id: '08e60c88-5948-478e-a132-02ec701d67b2',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					flashId: { type: 'string', format: 'misskey:id' },
					title: { type: 'string' },
					summary: { type: 'string' },
					script: { type: 'string' },
					permissions: {
						type: 'array', items: {
							type: 'string',
						}
					},
				},
				required: ['flashId', 'title', 'summary', 'script', 'permissions'],
			},
			res: undefined,
		}],
	},
	//#endregion

	//#region following
	'following/requests/accept': {
		tags: ['following', 'account'],

		requireCredential: true,

		kind: 'write:following',

		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '66ce1645-d66c-46bb-8b79-96739af885bd',
			},
			noFollowRequest: {
				message: 'No follow request.',
				code: 'NO_FOLLOW_REQUEST',
				id: 'bcde4f8b-0913-4614-8881-614e522fb041',
			},
		},

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
	'following/requests/cancel': {
		tags: ['following', 'account'],

		requireCredential: true,

		kind: 'write:following',

		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '4e68c551-fc4c-4e46-bb41-7d4a37bf9dab',
			},

			followRequestNotFound: {
				message: 'Follow request not found.',
				code: 'FOLLOW_REQUEST_NOT_FOUND',
				id: '089b125b-d338-482a-9a09-e2622ac9f8d4',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserLite',
			},
		}],
	},
	'following/requests/list': {
		tags: ['following', 'account'],

		requireCredential: true,

		kind: 'read:following',

		defines: [{
			req: {
				type: 'object',
				properties: {
					sinceId: { type: 'string', format: 'misskey:id' },
					untilId: { type: 'string', format: 'misskey:id' },
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				},
				required: [],
			},
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/FollowRequest',
				},
			},
		}],
	},
	'following/requests/reject': {
		tags: ['following', 'account'],

		requireCredential: true,

		kind: 'write:following',

		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: 'abc2ffa6-25b2-4380-ba99-321ff3a94555',
			},
		},

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
	'following/create': {
		tags: ['following', 'users'],
	
		limit: {
			duration: ms('1hour'),
			max: 50,
		},
	
		requireCredential: true,
	
		prohibitMoved: true,
	
		kind: 'write:following',
	
		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
			},
	
			followeeIsYourself: {
				message: 'Followee is yourself.',
				code: 'FOLLOWEE_IS_YOURSELF',
				id: '26fbe7bb-a331-4857-af17-205b426669a9',
			},
	
			alreadyFollowing: {
				message: 'You are already following that user.',
				code: 'ALREADY_FOLLOWING',
				id: '35387507-38c7-4cb9-9197-300b93783fa0',
			},
	
			blocking: {
				message: 'You are blocking that user.',
				code: 'BLOCKING',
				id: '4e2206ec-aa4f-4960-b865-6c23ac38e2d9',
			},
	
			blocked: {
				message: 'You are blocked by that user.',
				code: 'BLOCKED',
				id: 'c4ab57cc-4e41-45e9-bfd9-584f61e35ce0',
			},
		},
	
		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserLite',
			},
		}],
	},
	'following/delete': {
		tags: ['following', 'users'],
	
		limit: {
			duration: ms('1hour'),
			max: 100,
		},
	
		requireCredential: true,
	
		kind: 'write:following',
	
		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
			},
	
			followeeIsYourself: {
				message: 'Followee is yourself.',
				code: 'FOLLOWEE_IS_YOURSELF',
				id: 'd9e400b9-36b0-4808-b1d8-79e707f1296c',
			},
	
			notFollowing: {
				message: 'You are not following that user.',
				code: 'NOT_FOLLOWING',
				id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserLite',
			},
		}],
	},
	'following/invalidate': {
		tags: ['following', 'users'],
	
		limit: {
			duration: ms('1hour'),
			max: 100,
		},
	
		requireCredential: true,
	
		kind: 'write:following',
	
		errors: {
			noSuchUser: {
				message: 'No such user.',
				code: 'NO_SUCH_USER',
				id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
			},
	
			followerIsYourself: {
				message: 'Follower is yourself.',
				code: 'FOLLOWER_IS_YOURSELF',
				id: '07dc03b9-03da-422d-885b-438313707662',
			},
	
			notFollowing: {
				message: 'The other use is not following you.',
				code: 'NOT_FOLLOWING',
				id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
			},
		},
	
		defines: [{
			req: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'misskey:id' },
				},
				required: ['userId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/UserLite',
			},
		}],
	},
	//#endregion

	//#region gallery
	'gallery/posts/create': {
		tags: ['gallery'],
	
		requireCredential: true,
	
		prohibitMoved: true,
	
		kind: 'write:gallery',
	
		limit: {
			duration: ms('1hour'),
			max: 20,
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					title: { type: 'string', minLength: 1 },
					description: { type: ['string', 'null'] },
					fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
						type: 'string', format: 'misskey:id',
					} },
					isSensitive: { type: 'boolean', default: false },
				},
				required: ['title', 'fileIds'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
			},
		}],
	},
	'gallery/posts/delete': {
		tags: ['gallery'],
	
		requireCredential: true,
	
		kind: 'write:gallery',
	
		errors: {
			noSuchPost: {
				message: 'No such post.',
				code: 'NO_SUCH_POST',
				id: 'ae52f367-4bd7-4ecd-afc6-5672fff427f5',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					postId: { type: 'string', format: 'misskey:id' },
				},
				required: ['postId'],
			},
			res: undefined,
		}],
	},
	'gallery/posts/like': {
		tags: ['gallery'],
	
		requireCredential: true,
	
		prohibitMoved: true,
	
		kind: 'write:gallery-likes',
	
		errors: {
			noSuchPost: {
				message: 'No such post.',
				code: 'NO_SUCH_POST',
				id: '56c06af3-1287-442f-9701-c93f7c4a62ff',
			},
	
			yourPost: {
				message: 'You cannot like your post.',
				code: 'YOUR_POST',
				id: 'f78f1511-5ebc-4478-a888-1198d752da68',
			},
	
			alreadyLiked: {
				message: 'The post has already been liked.',
				code: 'ALREADY_LIKED',
				id: '40e9ed56-a59c-473a-bf3f-f289c54fb5a7',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					postId: { type: 'string', format: 'misskey:id' },
				},
				required: ['postId'],
			},
			res: undefined,
		}],
	},
	'gallery/posts/show': {
		tags: ['gallery'],
	
		requireCredential: false,
	
		errors: {
			noSuchPost: {
				message: 'No such post.',
				code: 'NO_SUCH_POST',
				id: '1137bf14-c5b0-4604-85bb-5b5371b1cd45',
			},
		},
	
		defines: [{
			req: {
				type: 'object',
				properties: {
					postId: { type: 'string', format: 'misskey:id' },
				},
				required: ['postId'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
			},
		}],
	},
	'gallery/posts/unlike': {
		tags: ['gallery'],
	
		requireCredential: true,
	
		prohibitMoved: true,
	
		kind: 'write:gallery-likes',
	
		errors: {
			noSuchPost: {
				message: 'No such post.',
				code: 'NO_SUCH_POST',
				id: 'c32e6dd0-b555-4413-925e-b3757d19ed84',
			},
	
			notLiked: {
				message: 'You have not liked that post.',
				code: 'NOT_LIKED',
				id: 'e3e8e06e-be37-41f7-a5b4-87a8250288f0',
			},
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					postId: { type: 'string', format: 'misskey:id' },
				},
				required: ['postId'],
			},
			res: undefined,
		}]
	},
	'gallery/posts/update': {
		tags: ['gallery'],
	
		requireCredential: true,
	
		prohibitMoved: true,
	
		kind: 'write:gallery',
	
		limit: {
			duration: ms('1hour'),
			max: 300,
		},

		defines: [{
			req: {
				type: 'object',
				properties: {
					postId: { type: 'string', format: 'misskey:id' },
					title: { type: 'string', minLength: 1 },
					description: { type: ['string', 'null'] },
					fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
						type: 'string', format: 'misskey:id',
					} },
					isSensitive: { type: 'boolean', default: false },
				},
				required: ['postId', 'title', 'fileIds'],
			},
			res: {
				$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
			},
		}],
	},
	'gallery/featured': {
		tags: ['gallery'],
	
		requireCredential: false,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
				},
			},
		}],
	},
	'gallery/popular': {
		tags: ['gallery'],
	
		requireCredential: false,

		defines: [{
			req: undefined,
			res: {
				type: 'array',
				items: {
					$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
				},
			},
		}],
	},
	'gallery/posts': {
		tags: ['gallery'],
	
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
					$ref: 'https://misskey-hub.net/api/schemas/GalleryPost',
				},
			},
		}],
	},
	//#endregion
} as const satisfies { [x: string]: IEndpointMeta; };

/**
 * JSON Schema規格に沿った形でreq/resのスキーマを取得する
 * 
 * 全てundefinedであればnullが返る
 * 複数の定義がある場合はoneOfで返される
 */
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
