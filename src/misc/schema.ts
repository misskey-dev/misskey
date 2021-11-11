import { SimpleObj, SimpleSchema } from './simple-schema';
import { packedUserSchema } from '@/models/repositories/user';
import { packedNoteSchema } from '@/models/repositories/note';
import { packedUserListSchema } from '@/models/repositories/user-list';
import { packedAppSchema } from '@/models/repositories/app';
import { packedMessagingMessageSchema } from '@/models/repositories/messaging-message';
import { packedNotificationSchema } from '@/models/repositories/notification';
import { packedDriveFileSchema } from '@/models/repositories/drive-file';
import { packedDriveFolderSchema } from '@/models/repositories/drive-folder';
import { packedFollowingSchema } from '@/models/repositories/following';
import { packedMutingSchema } from '@/models/repositories/muting';
import { packedBlockingSchema } from '@/models/repositories/blocking';
import { packedNoteReactionSchema } from '@/models/repositories/note-reaction';
import { packedHashtagSchema } from '@/models/repositories/hashtag';
import { packedPageSchema } from '@/models/repositories/page';
import { packedUserGroupSchema } from '@/models/repositories/user-group';
import { packedNoteFavoriteSchema } from '@/models/repositories/note-favorite';
import { packedChannelSchema } from '@/models/repositories/channel';
import { packedAntennaSchema } from '@/models/repositories/antenna';
import { packedClipSchema } from '@/models/repositories/clip';
import { packedFederationInstanceSchema } from '@/models/repositories/federation-instance';
import { packedQueueCountSchema } from '@/models/repositories/queue';
import { packedGalleryPostSchema } from '@/models/repositories/gallery-post';
import { packedEmojiSchema } from '@/models/repositories/emoji';
import { packedReversiGameSchema } from '@/models/repositories/games/reversi/game';
import { packedReversiMatchingSchema } from '@/models/repositories/games/reversi/matching';

export const refs = {
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
	ReversiGame: packedReversiGameSchema,
	ReversiMatching: packedReversiMatchingSchema,
};

export type Packed<x extends keyof typeof refs> = ObjType<(typeof refs[x])['properties']>;

export interface Schema extends SimpleSchema {
	items?: Schema;
	properties?: Obj;
	ref?: keyof typeof refs;
}

type NonUndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? never : K
}[keyof T];

type UndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? K : never
}[keyof T];

type OnlyRequired<T extends Obj> = Pick<T, NonUndefinedPropertyNames<T>>;
type OnlyOptional<T extends Obj> = Pick<T, UndefinedPropertyNames<T>>;

export interface Obj extends SimpleObj { [key: string]: Schema; }

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
