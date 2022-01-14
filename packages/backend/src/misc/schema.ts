import {
	packedUserLiteSchema,
	packedUserDetailedNotMeSchema,
	packedMeDetailedSchema,
	packedUserDetailedSchema,
	packedUserSchema,
} from '@/models/schema/user';
import { packedNoteSchema } from '@/models/schema/note';
import { packedUserListSchema } from '@/models/schema/user-list';
import { packedAppSchema } from '@/models/schema/app';
import { packedMessagingMessageSchema } from '@/models/schema/messaging-message';
import { packedNotificationSchema } from '@/models/schema/notification';
import { packedDriveFileSchema } from '@/models/schema/drive-file';
import { packedDriveFolderSchema } from '@/models/schema/drive-folder';
import { packedFollowingSchema } from '@/models/schema/following';
import { packedMutingSchema } from '@/models/schema/muting';
import { packedBlockingSchema } from '@/models/schema/blocking';
import { packedNoteReactionSchema } from '@/models/schema/note-reaction';
import { packedHashtagSchema } from '@/models/schema/hashtag';
import { packedPageSchema } from '@/models/schema/page';
import { packedUserGroupSchema } from '@/models/schema/user-group';
import { packedNoteFavoriteSchema } from '@/models/schema/note-favorite';
import { packedChannelSchema } from '@/models/schema/channel';
import { packedAntennaSchema } from '@/models/schema/antenna';
import { packedClipSchema } from '@/models/schema/clip';
import { packedFederationInstanceSchema } from '@/models/schema/federation-instance';
import { packedQueueCountSchema } from '@/models/schema/queue';
import { packedGalleryPostSchema } from '@/models/schema/gallery-post';
import { packedEmojiSchema } from '@/models/schema/emoji';

export const refs = {
	UserLite: packedUserLiteSchema,
	UserDetailedNotMe: packedUserDetailedNotMeSchema,
	MeDetailed: packedMeDetailedSchema,
	UserDetailed: packedUserDetailedSchema,
	User: packedUserSchema,

	UserList: packedUserListSchema,
	UserGroup: packedUserGroupSchema,
	App: packedAppSchema,
	MessagingMessage: packedMessagingMessageSchema,
	Note: packedNoteSchema,
	NoteReaction: packedNoteReactionSchema,
	NoteFavorite: packedNoteFavoriteSchema,
	Notification: packedNotificationSchema,
	DriveFile: packedDriveFileSchema,
	DriveFolder: packedDriveFolderSchema,
	Following: packedFollowingSchema,
	Muting: packedMutingSchema,
	Blocking: packedBlockingSchema,
	Hashtag: packedHashtagSchema,
	Page: packedPageSchema,
	Channel: packedChannelSchema,
	QueueCount: packedQueueCountSchema,
	Antenna: packedAntennaSchema,
	Clip: packedClipSchema,
	FederationInstance: packedFederationInstanceSchema,
	GalleryPost: packedGalleryPostSchema,
	Emoji: packedEmojiSchema,
};

export type Packed<x extends keyof typeof refs> = ObjType<(typeof refs[x])['properties']>;

export interface Schema {
	type: 'boolean' | 'number' | 'string' | 'array' | 'object' | 'any';
	nullable: boolean;
	optional: boolean;
	items?: Schema;
	properties?: Obj;
	description?: string;
	example?: any;
	format?: string;
	ref?: keyof typeof refs;
	enum?: string[];
	default?: boolean | null;
	maxLength?: number;
}

type NonUndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? never : K
}[keyof T];

type UndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? K : never
}[keyof T];

type OnlyRequired<T extends Obj> = Pick<T, NonUndefinedPropertyNames<T>>;
type OnlyOptional<T extends Obj> = Pick<T, UndefinedPropertyNames<T>>;

export interface Obj { [key: string]: Schema; }

export type ObjType<s extends Obj> =
	{ [P in keyof OnlyOptional<s>]?: SchemaType<s[P]> } &
	{ [P in keyof OnlyRequired<s>]: SchemaType<s[P]> };

// https://qiita.com/hrsh7th@github/items/84e8968c3601009cdcf2
type MyType<T extends Schema> = {
	0: any;
	1: SchemaType<T>;
}[T extends Schema ? 1 : 0];

type NullOrUndefined<p extends Schema, T> =
	p['nullable'] extends true
		?	p['optional'] extends true
			? (T | null | undefined)
			: (T | null)
		: p['optional'] extends true
			? (T | undefined)
			: T;

export type SchemaType<p extends Schema> =
	p['type'] extends 'number' ? NullOrUndefined<p, number> :
	p['type'] extends 'string' ? NullOrUndefined<p, string> :
	p['type'] extends 'boolean' ? NullOrUndefined<p, boolean> :
	p['type'] extends 'array' ? NullOrUndefined<p, MyType<NonNullable<p['items']>>[]> :
	p['type'] extends 'object' ? (
		p['ref'] extends keyof typeof refs
			? NullOrUndefined<p, Packed<p['ref']>>
			: NullOrUndefined<p, ObjType<NonNullable<p['properties']>>>
	) :
	p['type'] extends 'any' ? NullOrUndefined<p, any> :
	any;
