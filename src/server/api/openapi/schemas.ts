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
import { packedMutingSchema } from '../../../models/repositories/muting';
import { packedBlockingSchema } from '../../../models/repositories/blocking';
import { packedNoteReactionSchema } from '../../../models/repositories/note-reaction';
import { packedHashtagSchema } from '../../../models/repositories/hashtag';
import { packedPageSchema } from '../../../models/repositories/page';
import { packedUserGroupSchema } from '../../../models/repositories/user-group';
import { packedNoteFavoriteSchema } from '../../../models/repositories/note-favorite';
import { packedChannelSchema } from '../../../models/repositories/channel';

export function convertSchemaToOpenApiSchema(schema: Schema) {
	const res: any = schema;

	if (schema.type === 'object' && schema.properties) {
		res.required = Object.entries(schema.properties).filter(([k, v]) => !v.optional).map(([k]) => k);

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
	UserGroup: convertSchemaToOpenApiSchema(packedUserGroupSchema),
	App: convertSchemaToOpenApiSchema(packedAppSchema),
	MessagingMessage: convertSchemaToOpenApiSchema(packedMessagingMessageSchema),
	Note: convertSchemaToOpenApiSchema(packedNoteSchema),
	NoteReaction: convertSchemaToOpenApiSchema(packedNoteReactionSchema),
	NoteFavorite: convertSchemaToOpenApiSchema(packedNoteFavoriteSchema),
	Notification: convertSchemaToOpenApiSchema(packedNotificationSchema),
	DriveFile: convertSchemaToOpenApiSchema(packedDriveFileSchema),
	DriveFolder: convertSchemaToOpenApiSchema(packedDriveFolderSchema),
	Following: convertSchemaToOpenApiSchema(packedFollowingSchema),
	Muting: convertSchemaToOpenApiSchema(packedMutingSchema),
	Blocking: convertSchemaToOpenApiSchema(packedBlockingSchema),
	Hashtag: convertSchemaToOpenApiSchema(packedHashtagSchema),
	Page: convertSchemaToOpenApiSchema(packedPageSchema),
	Channel: convertSchemaToOpenApiSchema(packedChannelSchema),
};
