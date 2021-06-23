export type ID = string;
export type DateString = string;

type TODO = Record<string, any>;

// NOTE: 極力この型を使うのは避け、UserLite か UserDetailed か明示するように
export type User = UserLite | UserDetailed;

export type UserLite = {
	id: ID;
	username: string;
	host: string | null;
	name: string;
	onlineStatus: 'online' | 'active' | 'offline' | 'unknown';
	avatarUrl: string;
	avatarBlurhash: string;
	emojis: {
		name: string;
		url: string;
	}[];
};

export type UserDetailed = UserLite & {
	isLocked: boolean;
	pinnedNotes: Note[];
	// TODO
};

export type UserGroup = TODO;

export type UserList = {
	id: ID;
	createdAt: DateString;
	name: string;
	userIds: User['id'][];
};

export type MeDetailed = UserDetailed & {
	avatarId: DriveFile['id'];
	bannerId: DriveFile['id'];
	autoAcceptFollowed: boolean;
	noCrawle: boolean;
	isExplorable: boolean;
	hideOnlineStatus: boolean;
	mutedWords: string[][];
	[other: string]: any;
};

export type DriveFile = {
	id: ID;
	createdAt: DateString;
	isSensitive: boolean;
	name: string;
	thumbnailUrl: string;
	url: string;
	type: string;
	size: number;
	md5: string;
	blurhash: string;
	properties: Record<string, any>;
};

export type DriveFolder = TODO;

export type GalleryPost = TODO;

export type Note = {
	id: ID;
	createdAt: DateString;
	text: string | null;
	cw: string | null;
	user: User;
	userId: User['id'];
	reply?: Note;
	replyId: Note['id'];
	renote?: Note;
	renoteId: Note['id'];
	files: DriveFile[];
	fileIds: DriveFile['id'][];
	visibility: 'public' | 'home' | 'followers' | 'specified';
	myReaction?: string;
	reactions: Record<string, number>;
	poll?: {
		expiresAt: DateString | null;
		multiple: boolean;
		choices: {
			isVoted: boolean;
			text: string;
			votes: number;
		}[];
	};
	emojis: {
		name: string;
		url: string;
	}[];
};

export type Notification = {
	id: ID;
	createdAt: DateString;
	isRead: boolean;
} & ({
	type: 'reaction';
	reaction: string;
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'reply';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'renote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'quote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'mention';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'pollVote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'follow';
	user: User;
	userId: User['id'];
} | {
	type: 'followRequestAccepted';
	user: User;
	userId: User['id'];
} | {
	type: 'receiveFollowRequest';
	user: User;
	userId: User['id'];
} | {
	type: 'groupInvited'; // TODO
} | {
	type: 'app';
	body: string;
	icon: string;
});

export type MessagingMessage = {
	id: ID;
	createdAt: DateString;
	file: DriveFile | null;
	fileId: DriveFile['id'] | null;
	isRead: boolean;
	reads: User['id'][];
	text: string | null;
	user: User;
	userId: User['id'];
	groupId: string; // TODO
};

export type CustomEmoji = {
	id: string;
	name: string;
	url: string;
	category: string;
	aliases: string[];
};

export type LiteInstanceMetadata = {
	maintainerName: string | null;
	maintainerEmail: string | null;
	version: string;
	name: string | null;
	uri: string;
	description: string | null;
	tosUrl: string | null;
	disableRegistration: boolean;
	disableLocalTimeline: boolean;
	disableGlobalTimeline: boolean;
	driveCapacityPerLocalUserMb: number;
	driveCapacityPerRemoteUserMb: number;
	enableHcaptcha: boolean;
	hcaptchaSiteKey: string | null;
	enableRecaptcha: boolean;
	recaptchaSiteKey: string | null;
	swPublickey: string | null;
	maxNoteTextLength: number;
	enableEmail: boolean;
	enableTwitterIntegration: boolean;
	enableGithubIntegration: boolean;
	enableDiscordIntegration: boolean;
	enableServiceWorker: boolean;
	emojis: CustomEmoji[];
	ads: {
		id: ID;
		ratio: number;
		place: string;
		url: string;
		imageUrl: string;
	}[];
};

export type DetailedInstanceMetadata = LiteInstanceMetadata & {
	features: Record<string, any>;
};

export type InstanceMetadata = LiteInstanceMetadata | DetailedInstanceMetadata;

export type ServerInfo = {
	machine: string;
	cpu: {
		model: string;
		cores: number;
	};
	mem: {
		total: number;
	};
	fs: {
		total: number;
		used: number;
	};
};

export type Stats = {
	notesCount: number;
	originalNotesCount: number;
	usersCount: number;
	originalUsersCount: number;
	instances: number;
	driveUsageLocal: number;
	driveUsageRemote: number;
};

export type Page = {
	id: ID;
	createdAt: DateString;
	updatedAt: DateString;
	userId: User['id'];
	user: User;
	content: Record<string, any>[];
	variables: Record<string, any>[];
	title: string;
	name: string;
	summary: string | null;
	hideTitleWhenPinned: boolean;
	alignCenter: boolean;
	font: string;
	script: string;
	eyeCatchingImageId: DriveFile['id'] | null;
	eyeCatchingImage: DriveFile | null;
	attachedFiles: any;
	likedCount: number;
	isLiked?: boolean;
};

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	var: any;
	userId: User['id'];
	user: User;
};

export type Announcement = {
	id: ID;
	createdAt: DateString;
	updatedAt: DateString | null;
	text: string;
	title: string;
	imageUrl: string | null;
	isRead?: boolean;
};

export type Antenna = {
	id: ID;
	createdAt: DateString;
	name: string;
	keywords: string[][]; // TODO
	excludeKeywords: string[][]; // TODO
	src: 'home' | 'all' | 'users' | 'list' | 'group';
	userListId: ID | null; // TODO
	userGroupId: ID | null; // TODO
	users: string[]; // TODO
	caseSensitive: boolean;
	notify: boolean;
	withReplies: boolean;
	withFile: boolean;
	hasUnreadNote: boolean;
};

export type App = TODO;

export type AuthSession = {
	id: ID;
	app: App;
	token: string;
};

export type Ad = TODO;

export type Clip = TODO;

export type NoteFavorite = {
	id: ID;
	createdAt: DateString;
	noteId: Note['id'];
	note: Note;
};

export type FollowRequest = {
	id: ID;
	follower: User;
	followee: User;
};

export type Channel = {
	id: ID;
	// TODO
};

export type Following = {
	id: ID;
	createdAt: DateString;
	followerId: User['id'];
	followeeId: User['id'];
};

export type FollowingFolloweePopulated = Following & {
	followee: UserDetailed;
};

export type FollowingFollowerPopulated = Following & {
	follower: UserDetailed;
};

export type UserSorting = '+follower' | '-follower' | '+createdAt' | '-createdAt' | '+updatedAt' | '-updatedAt';
export type OriginType = 'combined' | 'local' | 'remote';
