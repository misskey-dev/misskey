import { packedUserSchema } from '../../../models/repositories/user';
import { Schema } from '../../../misc/schema';
import { packedNoteSchema } from '../../../models/repositories/note';
import { packedUserListSchema } from '../../../models/repositories/user-list';
import { packedAppSchema } from '../../../models/repositories/app';

function convertSchemaToOpenApiSchema(schema: Schema) {
	const res: any = schema;

	if (schema.type === 'object' && schema.properties) {
		res.required = Object.entries(schema.properties).filter(([k, v]) => v.optional !== true).map(([k]) => k);

		for (const k of Object.keys(schema.properties)) {
			res.properties[k] = convertSchemaToOpenApiSchema(schema.properties[k]);
		}
	}

	if (schema.type === 'array' && schema.items) {
		res.items = convertSchemaToOpenApiSchema(schema.items);
	}

	if (schema.ref) {
		res.$ref = `#/components/schemas/${schema.ref}`;
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
					}
				},
				required: ['code', 'id', 'message']
			},
		},
		required: ['error']
	},

	User: convertSchemaToOpenApiSchema(packedUserSchema),

	UserList: convertSchemaToOpenApiSchema(packedUserListSchema),

	App: convertSchemaToOpenApiSchema(packedAppSchema),

	MessagingMessage: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this MessagingMessage.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the MessagingMessage was created.'
			},
			text: {
				type: 'string',
				nullable: true
			},
			file: {
				type: 'DriveFile',
				nullable: true
			},
			recipientId: {
				type: 'string',
				format: 'id',
			},
			recipient: {
				$ref: '#/components/schemas/User'
			},
		},
		required: ['id', 'createdAt']
	},

	Note: convertSchemaToOpenApiSchema(packedNoteSchema),

	Notification: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this notification.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the notification was created.'
			},
			type: {
				type: 'string',
				enum: ['follow', 'receiveFollowRequest', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote'],
				description: 'The type of the notification.'
			},
		},
		required: ['id', 'createdAt', 'type']
	},

	DriveFile: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Drive file.',
				example: 'xxxxxxxxxx',
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
			size: {
				type: 'number',
				description: 'The size of this Drive file. (bytes)',
				example: 51469
			},
			folderId: {
				type: 'string',
				format: 'id',
				nullable: true,
				description: 'The parent folder ID of this Drive file.',
				example: 'xxxxxxxxxx',
			},
			isSensitive: {
				type: 'boolean',
				description: 'Whether this Drive file is sensitive.',
			},
		},
		required: ['id', 'createdAt', 'name', 'type', 'size', 'md5']
	},

	DriveFolder: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Drive folder.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the Drive folder was created.'
			},
			name: {
				type: 'string',
				description: 'The folder name.',
			},
			foldersCount: {
				type: 'number',
				description: 'The count of child folders.',
			},
			filesCount: {
				type: 'number',
				description: 'The count of child files.',
			},
			parentId: {
				type: 'string',
				format: 'id',
				nullable: true,
				description: 'The parent folder ID of this folder.',
				example: 'xxxxxxxxxx',
			},
			parent: {
				$ref: '#/components/schemas/DriveFolder'
			},
		},
		required: ['id', 'createdAt', 'name']
	},

	Following: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this following.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the following was created.'
			},
			followeeId: {
				type: 'string',
				format: 'id',
			},
			followee: {
				$ref: '#/components/schemas/User',
				description: 'The followee.'
			},
			followerId: {
				type: 'string',
				format: 'id',
			},
			follower: {
				$ref: '#/components/schemas/User',
				description: 'The follower.'
			},
		},
		required: ['id', 'createdAt', 'followeeId', 'followerId']
	},

	Muting: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this mute.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the mute was created.'
			},
			mutee: {
				$ref: '#/components/schemas/User',
				description: 'The mutee.'
			},
		},
		required: ['id', 'createdAt', 'mutee']
	},

	Blocking: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this block.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the block was created.'
			},
			blockee: {
				$ref: '#/components/schemas/User',
				description: 'The blockee.'
			},
		},
		required: ['id', 'createdAt', 'blockee']
	},

	Reaction: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this reaction.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the reaction was created.'
			},
			user: {
				$ref: '#/components/schemas/User',
				description: 'User who performed this reaction.'
			},
			type: {
				type: 'string',
				enum: [
					'like',
					'love',
					'laugh',
					'hmm',
					'surprise',
					'congrats',
					'angry',
					'confused',
					'rip',
					'pudding',
					'star'
				],
				description: 'The reaction type.'
			},
		},
		required: ['id', 'createdAt', 'user', 'type']
	},

	Hashtag: {
		type: 'object',
		properties: {
			tag: {
				type: 'string',
				description: 'The hashtag name. No # prefixed.',
				example: 'misskey',
			},
			mentionedUsersCount: {
				type: 'number',
				description: 'Number of all users using this hashtag.'
			},
			mentionedLocalUsersCount: {
				type: 'number',
				description: 'Number of local users using this hashtag.'
			},
			mentionedRemoteUsersCount: {
				type: 'number',
				description: 'Number of remote users using this hashtag.'
			},
			attachedUsersCount: {
				type: 'number',
				description: 'Number of all users who attached this hashtag to profile.'
			},
			attachedLocalUsersCount: {
				type: 'number',
				description: 'Number of local users who attached this hashtag to profile.'
			},
			attachedRemoteUsersCount: {
				type: 'number',
				description: 'Number of remote users who attached this hashtag to profile.'
			},
		},
		required: [
			'tag',
			'mentionedUsersCount',
			'mentionedLocalUsersCount',
			'mentionedRemoteUsersCount',
			'attachedUsersCount',
			'attachedLocalUsersCount',
			'attachedRemoteUsersCount',
		]
	},
};
