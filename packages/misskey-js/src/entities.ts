import { Serialized } from "schema-type";
import { Packed } from "./schemas";

export type ID = Packed<'Id'>;
export type DateString = string;

type TODO = Record<string, any>;

// NOTE: 極力この型を使うのは避け、UserLite か UserDetailed か明示するように
export type User = Serialized<Packed<'User'>>;

export type UserLite = Serialized<Packed<'UserLite'>>;
export type UserDetailed = Serialized<Packed<'UserDetailed'>>;
export type UserList = Serialized<Packed<'UserList'>>;
export type MeDetailed = Serialized<Packed<'MeDetailed'>>;
export type DriveFile = Serialized<Packed<'DriveFile'>>;
export type DriveFolder = Serialized<Packed<'DriveFolder'>>;
export type GalleryPost = Serialized<Packed<'GalleryPost'>>;
export type Note = Serialized<Packed<'Note'>>;
export type NoteReaction = Serialized<Packed<'NoteReaction'>>;
export type NoteFavorite = Serialized<Packed<'NoteFavorite'>>;
export type Notification = Serialized<Packed<'NotificationStrict'>>;
export type CustomEmoji = Serialized<Packed<'EmojiSimple'> | Packed<'EmojiDetailed'>>;
export type Page = Serialized<Packed<'Page'>>;

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	var: any;
	userId: User['id'];
	user: User;
};

export type Announcement = Serialized<Packed<'Announcement'>>;
export type Antenna = Serialized<Packed<'Antenna'>>;
export type App = Serialized<Packed<'App'>>;
export type Ad = Serialized<Packed<'Ad'>>;
export type Clip = Serialized<Packed<'Clip'>>;
export type Channel = Serialized<Packed<'Channel'>>;
export type Following = Serialized<Packed<'Following'>>;
export type Blocking = Serialized<Packed<'Blocking'>>;
export type Relay = Serialized<Packed<'Relay'>>;
export type Role = Serialized<Packed<'Role'>>;
export type RoleAssign = Serialized<Packed<'RoleAssign'>>;
export type RolePolicy = Serialized<Packed<'RolePolicy'>>;
export type RoleCondFormula = Serialized<Packed<'RoleCondFormula'>>;

export type LiteInstanceMetadata = {
	maintainerName: string | null;
	maintainerEmail: string | null;
	version: string;
	name: string | null;
	uri: string;
	description: string | null;
	langs: string[];
	tosUrl: string | null;
	repositoryUrl: string;
	feedbackUrl: string;
	disableRegistration: boolean;
	disableLocalTimeline: boolean;
	disableGlobalTimeline: boolean;
	driveCapacityPerLocalUserMb: number;
	driveCapacityPerRemoteUserMb: number;
	emailRequiredForSignup: boolean;
	enableHcaptcha: boolean;
	hcaptchaSiteKey: string | null;
	enableRecaptcha: boolean;
	recaptchaSiteKey: string | null;
	enableTurnstile: boolean;
	turnstileSiteKey: string | null;
	swPublickey: string | null;
	themeColor: string | null;
	mascotImageUrl: string | null;
	bannerUrl: string | null;
	errorImageUrl: string | null;
	iconUrl: string | null;
	backgroundImageUrl: string | null;
	logoImageUrl: string | null;
	maxNoteTextLength: number;
	enableEmail: boolean;
	enableTwitterIntegration: boolean;
	enableGithubIntegration: boolean;
	enableDiscordIntegration: boolean;
	enableServiceWorker: boolean;
	emojis: CustomEmoji[];
	defaultDarkTheme: string | null;
	defaultLightTheme: string | null;
	ads: {
		id: ID;
		ratio: number;
		place: string;
		url: string;
		imageUrl: string;
	}[];
	translatorAvailable: boolean;
	serverRules: string[];
};

export type DetailedInstanceMetadata = LiteInstanceMetadata & {
	pinnedPages: string[];
	pinnedClipId: string | null;
	cacheRemoteFiles: boolean;
	requireSetup: boolean;
	proxyAccountName: string | null;
	features: Record<string, any>;
};

export type InstanceMetadata = LiteInstanceMetadata | DetailedInstanceMetadata;

export type ServerInfo = Serialized<Packed<'ServerInfo'>>;

export type Stats = {
	notesCount: number;
	originalNotesCount: number;
	usersCount: number;
	originalUsersCount: number;
	instances: number;
	driveUsageLocal: number;
	driveUsageRemote: number;
};

export type AuthSession = {
	id: ID;
	app: App;
	token: string;
};

export type FollowRequest = {
	id: ID;
	follower: User;
	followee: User;
};

export type FollowingFolloweePopulated = Following & {
	followee: UserDetailed;
};

export type FollowingFollowerPopulated = Following & {
	follower: UserDetailed;
};

export type Instance = {
	id: ID;
	caughtAt: DateString;
	host: string;
	usersCount: number;
	notesCount: number;
	followingCount: number;
	followersCount: number;
	driveUsage: number;
	driveFiles: number;
	latestRequestSentAt: DateString | null;
	latestStatus: number | null;
	latestRequestReceivedAt: DateString | null;
	lastCommunicatedAt: DateString;
	isNotResponding: boolean;
	isSuspended: boolean;
	softwareName: string | null;
	softwareVersion: string | null;
	openRegistrations: boolean | null;
	name: string | null;
	description: string | null;
	maintainerName: string | null;
	maintainerEmail: string | null;
	iconUrl: string | null;
	faviconUrl: string | null;
	themeColor: string | null;
	infoUpdatedAt: DateString | null;
};

export type Signin = Serialized<Packed<'SignIn'>>;

export type UserSorting =
	| '+follower'
	| '-follower'
	| '+createdAt'
	| '-createdAt'
	| '+updatedAt'
	| '-updatedAt';
export type OriginType = 'combined' | 'local' | 'remote';
