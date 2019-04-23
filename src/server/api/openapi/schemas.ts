import { packedUserSchema } from '../../../models/repositories/user';
import { Schema } from '../../../misc/schema';
import { packedNoteSchema } from '../../../models/repositories/note';
import { packedUserListSchema } from '../../../models/repositories/user-list';
import { packedAppSchema } from '../../../models/repositories/app';
import { packedMessagingMessageSchema } from '../../../models/repositories/messaging-message';
import { packedNotificationSchema } from '../../../models/repositories/notification';
import { packedDriveFileSchema } from '../../../models/repositories/drive-file';
import { packedDriveFolderSchema } from '../../../models/repositories/drive-folder';
import { packedFollowingSchema } from '../../../models/repositories/following';

export function convertSchemaToOpenApiSchema(schema: Schema) {
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

	MessagingMessage: convertSchemaToOpenApiSchema(packedMessagingMessageSchema),

	Note: convertSchemaToOpenApiSchema(packedNoteSchema),

	Notification: convertSchemaToOpenApiSchema(packedNotificationSchema),

	DriveFile: convertSchemaToOpenApiSchema(packedDriveFileSchema),

	DriveFolder: convertSchemaToOpenApiSchema(packedDriveFolderSchema),

	Following: convertSchemaToOpenApiSchema(packedFollowingSchema),

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
