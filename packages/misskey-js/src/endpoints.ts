import { JSONSchema7 } from 'schema-type';
import { IEndpointMeta } from './endpoints.types';
import { localUsernameSchema, passwordSchema } from './schemas/user';

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
					errorImageUrl: { type: ['string', 'null'] },
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
