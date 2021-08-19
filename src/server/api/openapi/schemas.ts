import { packedUserSchema } from '@/models/repositories/user.js';
import { Schema } from '@/misc/schema.js';
import { packedNoteSchema } from '@/models/repositories/note.js';
import { packedUserListSchema } from '@/models/repositories/user-list.js';
import { packedAppSchema } from '@/models/repositories/app.js';
import { packedMessagingMessageSchema } from '@/models/repositories/messaging-message.js';
import { packedNotificationSchema } from '@/models/repositories/notification.js';
import { packedDriveFileSchema } from '@/models/repositories/drive-file.js';
import { packedDriveFolderSchema } from '@/models/repositories/drive-folder.js';
import { packedFollowingSchema } from '@/models/repositories/following.js';
import { packedMutingSchema } from '@/models/repositories/muting.js';
import { packedBlockingSchema } from '@/models/repositories/blocking.js';
import { packedNoteReactionSchema } from '@/models/repositories/note-reaction.js';
import { packedHashtagSchema } from '@/models/repositories/hashtag.js';
import { packedPageSchema } from '@/models/repositories/page.js';
import { packedUserGroupSchema } from '@/models/repositories/user-group.js';
import { packedNoteFavoriteSchema } from '@/models/repositories/note-favorite.js';
import { packedChannelSchema } from '@/models/repositories/channel.js';
import { packedAntennaSchema } from '@/models/repositories/antenna.js';
import { packedClipSchema } from '@/models/repositories/clip.js';
import { packedFederationInstanceSchema } from '@/models/repositories/federation-instance.js';
import { packedQueueCountSchema } from '@/models/repositories/queue.js';
import { packedGalleryPostSchema } from '@/models/repositories/gallery-post.js';

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
	QueueCount: convertSchemaToOpenApiSchema(packedQueueCountSchema),
	Antenna: convertSchemaToOpenApiSchema(packedAntennaSchema),
	Clip: convertSchemaToOpenApiSchema(packedClipSchema),
	FederationInstance: convertSchemaToOpenApiSchema(packedFederationInstanceSchema),
	GalleryPost: convertSchemaToOpenApiSchema(packedGalleryPostSchema),
};
