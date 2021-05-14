type ID = string;

export type User = {
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

export type DriveFile = {
	id: ID;
	createdAt: string;
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

export type Note = {
	id: ID;
	createdAt: string;
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
		expiresAt: string | null;
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

export type Instance = {
	emojis: {
		category: string;
	}[];
	ads: {
		id: ID;
		ratio: number;
		place: string;
		url: string;
		imageUrl: string;
	}[];
};
