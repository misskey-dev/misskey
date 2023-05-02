import type { FromSchema, JSONSchema7Reference } from 'json-schema-to-ts';

import { IdSchema } from './schemas/id.js';
import {
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
	packedMeDetailedOnlySchema,
	packedUserDetailedNotMeSchema,
	packedMeDetailedSchema,
	packedUserDetailedSchema,
	packedUserSchema,
} from './schemas/user.js';
import { packedNoteSchema } from './schemas/note.js';
import { packedUserListSchema } from './schemas/user-list.js';
import { packedAppSchema } from './schemas/app.js';
import { packedNotificationSchema } from './schemas/notification.js';
import { packedDriveFileSchema } from './schemas/drive-file.js';
import { packedDriveFolderSchema } from './schemas/drive-folder.js';
import { packedFollowingSchema } from './schemas/following.js';
import { packedMutingSchema } from './schemas/muting.js';
import { packedRenoteMutingSchema } from './schemas/renote-muting.js';
import { packedBlockingSchema } from './schemas/blocking.js';
import { packedNoteReactionSchema } from './schemas/note-reaction.js';
import { packedHashtagSchema } from './schemas/hashtag.js';
import { packedPageSchema } from './schemas/page.js';
import { packedNoteFavoriteSchema } from './schemas/note-favorite.js';
import { packedChannelSchema } from './schemas/channel.js';
import { packedAntennaSchema } from './schemas/antenna.js';
import { packedClipSchema } from './schemas/clip.js';
import { packedFederationInstanceSchema } from './schemas/federation-instance.js';
import { packedQueueCountSchema } from './schemas/queue.js';
import { packedGalleryPostSchema } from './schemas/gallery-post.js';
import { packedEmojiDetailedSchema, packedEmojiSimpleSchema } from './schemas/emoji.js';
import { packedFlashSchema } from './schemas/flash.js';

export const refs = {
	UserLite: packedUserLiteSchema,
	UserDetailedNotMeOnly: packedUserDetailedNotMeOnlySchema,
	MeDetailedOnly: packedMeDetailedOnlySchema,
	UserDetailedNotMe: packedUserDetailedNotMeSchema,
	MeDetailed: packedMeDetailedSchema,
	UserDetailed: packedUserDetailedSchema,
	User: packedUserSchema,

	UserList: packedUserListSchema,
	App: packedAppSchema,
	Note: packedNoteSchema,
	NoteReaction: packedNoteReactionSchema,
	NoteFavorite: packedNoteFavoriteSchema,
	Notification: packedNotificationSchema,
	DriveFile: packedDriveFileSchema,
	DriveFolder: packedDriveFolderSchema,
	Following: packedFollowingSchema,
	Muting: packedMutingSchema,
	RenoteMuting: packedRenoteMutingSchema,
	Blocking: packedBlockingSchema,
	Hashtag: packedHashtagSchema,
	Page: packedPageSchema,
	Channel: packedChannelSchema,
	QueueCount: packedQueueCountSchema,
	Antenna: packedAntennaSchema,
	Clip: packedClipSchema,
	FederationInstance: packedFederationInstanceSchema,
	GalleryPost: packedGalleryPostSchema,
	EmojiSimple: packedEmojiSimpleSchema,
	EmojiDetailed: packedEmojiDetailedSchema,
	Flash: packedFlashSchema,
} as const satisfies { [x: string]: JSONSchema7Reference };

type Refs = typeof packedAntennaSchema | typeof packedNoteSchema; // TODO: typeof refs[keyof typeof refs];
type UnionToArray<T, A extends unknown[] = []> = T extends any ? [T, ...A] : never;

export type References = [
    typeof IdSchema,
    ...UnionToArray<Refs>
];

export type Packed<T extends keyof typeof refs> = FromSchema<typeof refs[T], { references: References }>
