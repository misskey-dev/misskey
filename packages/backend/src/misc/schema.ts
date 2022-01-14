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

type TypeStringef = 'boolean' | 'number' | 'string' | 'array' | 'object' | 'any';
type StringDefToType<T extends TypeStringef> =
	T extends 'boolean' ? boolean :
	T extends 'number' ? number :
	T extends 'string' ? string | Date :
	T extends 'array' ? ReadonlyArray<any> :
	T extends 'object' ? Record<string, any> :
	any;

// https://swagger.io/specification/?sbsearch=optional#schema-object
type OfSchema = {
	readonly anyOf?: ReadonlyArray<MinimumSchema>;
	readonly oneOf?: ReadonlyArray<MinimumSchema>;
	readonly allOf?: ReadonlyArray<MinimumSchema>;
}

export interface MinimumSchema extends OfSchema {
	readonly type?: TypeStringef;
	readonly nullable?: boolean;
	readonly optional?: boolean;
	readonly items?: MinimumSchema;
	readonly properties?: Obj;
	readonly description?: string;
	readonly example?: any;
	readonly format?: string;
	readonly ref?: keyof typeof refs;
	readonly enum?: ReadonlyArray<string>;
	readonly default?: (this['type'] extends TypeStringef ? StringDefToType<this['type']> : any) | null;
	readonly maxLength?: number;
	readonly minLength?: number;
}

export interface Schema extends MinimumSchema {
	readonly nullable: boolean;
	readonly optional: boolean;
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

type Mutable<T> = { -readonly [P in keyof T ]: T[P] };

export type ObjType<s extends Obj> =
	Mutable<{ [P in keyof OnlyOptional<s>]?: SchemaType<s[P]> }> &
	Mutable<{ [P in keyof OnlyRequired<s>]: SchemaType<s[P]> }>;

type NullOrUndefined<p extends Schema, T> =
	p['nullable'] extends true
		?	p['optional'] extends true
			? (T | null | undefined)
			: (T | null)
		: p['optional'] extends true
			? (T | undefined)
			: T;

// 共用体型を交差型にする型 https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type MinimumSchemaType<p extends MinimumSchema> =
	p['type'] extends 'number' ? number :
	p['type'] extends 'string' ? (
		p['enum'] extends ReadonlyArray<string> ?
			p['enum'][number] :
			string
	) :
	p['type'] extends 'boolean' ? boolean :
	p['type'] extends 'array' ? (
		p['items'] extends MinimumSchema ? (
			p['items']['anyOf'] extends ReadonlyArray<MinimumSchema> ? MinimumSchemaType<NonNullable<p['items']['anyOf']>[number]>[] :
			p['items']['oneOf'] extends ReadonlyArray<MinimumSchema> ? MinimumSchemaType<NonNullable<p['items']['oneOf']>[number]>[] :
			p['items']['allOf'] extends ReadonlyArray<MinimumSchema> ? UnionToIntersection<MinimumSchemaType<NonNullable<p['items']['allOf']>[number]>>[] :
			MinimumSchemaType<NonNullable<p['items']>>[]
		) :
		any[]
	) :
	p['type'] extends 'object' ? (
		p['ref'] extends keyof typeof refs ? Packed<p['ref']> :
		p['properties'] extends Obj ? ObjType<NonNullable<p['properties']>> :
		p['anyOf'] extends ReadonlyArray<MinimumSchema> ? MinimumSchemaType<NonNullable<p['anyOf']>[number]> & Partial<UnionToIntersection<MinimumSchemaType<NonNullable<p['anyOf']>[number]>>> :
		p['allOf'] extends ReadonlyArray<MinimumSchema> ? UnionToIntersection<MinimumSchemaType<NonNullable<p['anyOf']>[number]>> :
		any
	) :
	p['oneOf'] extends MinimumSchema ? MinimumSchemaType<NonNullable<p['oneOf']>[number]> :
	any;

export type SchemaType<p extends Schema> = NullOrUndefined<p, MinimumSchemaType<p>>;
