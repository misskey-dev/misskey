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
import {
	notificationTypeSchema,
	packedNotificationSchema,
	packedNotificationStrictSchema,
} from './schemas/notification.js';
import { packedNoteSchema } from './schemas/note.js';
import { packedUserListSchema } from './schemas/user-list.js';
import { packedAppSchema } from './schemas/app.js';
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
import { packedAdSchema } from './schemas/ad.js';
import { packedAnnouncementSchema } from './schemas/announcement.js';
import { packedRelaySchema } from './schemas/relay.js';
import { packedAbuseUserReportSchema } from './schemas/abuse-user-report.js';
import {
	packedRoleSchema,
	packedRoleAssignSchema,
	packedRolePolicySchema,
	packedRoleCondFormulaSchema,
} from './schemas/role.js';
import {
	InstanceMetaSharedSchema,
	InstanceMetaAdminSchema,
} from './schemas/instance-meta.js';
import {
	ServerInfoSchema,
	ServerInfoAdminSchema,
} from './schemas/server-info.js';
import {
	SignInSchema,
} from './schemas/sign-in.js';
import { packedModerationLogSchema } from './schemas/moderation-log.js';
import { packedAuthSessionSchema } from './schemas/auth-session.js';
import { Error, ApiError } from './schemas/error.js';
import type { JSONSchema7, JSONSchema7Definition, GetDef, GetRefs, GetKeys, UnionToArray, Serialized, Projected } from 'schema-type';

export const refs = {
	Id: IdSchema,

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
	NotificationType: notificationTypeSchema,
	Notification: packedNotificationSchema,
	NotificationStrict: packedNotificationStrictSchema,
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
	Ad: packedAdSchema,
	Announcement: packedAnnouncementSchema,
	Relay: packedRelaySchema,
	Role: packedRoleSchema,
	RoleAssign: packedRoleAssignSchema,
	RolePolicy: packedRolePolicySchema,
	RoleCondFormula: packedRoleCondFormulaSchema,
	AbuseUserReport: packedAbuseUserReportSchema,
	InstanceMetaShared: InstanceMetaSharedSchema,
	InstanceMetaAdmin: InstanceMetaAdminSchema,
	ServerInfo: ServerInfoSchema,
	ServerInfoAdmin: ServerInfoAdminSchema,
	ModerationLog: packedModerationLogSchema,
	SignIn: SignInSchema,
	AuthSession: packedAuthSessionSchema,

	Error: Error,
	ApiError: ApiError,
} as const satisfies { [x: string]: JSONSchema7Definition };

export type References = GetRefs<typeof refs>;

export type Packed<x extends GetKeys<References, 'https://misskey-hub.net/api/schemas/'>> = Serialized<GetDef<References, x, false, 'https://misskey-hub.net/api/schemas/'>>;
export type Def<x extends GetKeys<References>> = GetDef<References, x>;

//#reginon Chart
export type ChartSchema = Record<string, {
	uniqueIncrement?: boolean;

	intersection?: string[] | ReadonlyArray<string>;

	range?: 'big' | 'small' | 'medium';

	// previousな値を引き継ぐかどうか
	accumulate?: boolean;
}>;

export type ChartResult<T extends ChartSchema> = {
	[P in keyof T]: number[];
};

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

type UnflattenSingleton<K extends string, V> = K extends `${infer A}.${infer B}`
	? { [_ in A]: UnflattenSingleton<B, V>; }
	: { [_ in K]: V; };

export type Unflatten<T extends Record<string, any>> = Projected<UnionToIntersection<
	{
		[K in Extract<keyof T, string>]: UnflattenSingleton<K, T[K]>;
	}[Extract<keyof T, string>]
>>;

type ToJsonSchema<S> = {
	type: 'object';
	properties: {
		[K in keyof S]: S[K] extends number[] ? { type: 'array'; items: { type: 'number'; }; } : ToJsonSchema<S[K]>;
	},
	required: (keyof S)[];
};

export function getJsonSchema<S extends ChartSchema>(schema: S): ToJsonSchema<Unflatten<ChartResult<S>>> {
	const jsonSchema = {
		type: 'object',
		properties: {} as Record<string, unknown>,
		required: [],
	};

	for (const k in schema) {
		jsonSchema.properties[k] = {
			type: 'array',
			items: { type: 'number' },
		};
	}

	return jsonSchema as ToJsonSchema<Unflatten<ChartResult<S>>>;
}
//#endregion
