import { CustomEmoji, DriveFile, MeDetailed, MessagingMessage, Note, Notification, PageEvent, User, UserGroup } from './entities';

export type Channels = {
	main: {
		params: null;
		events: {
			notification: (payload: Notification) => void;
			mention: (payload: Note) => void;
			reply: (payload: Note) => void;
			renote: (payload: Note) => void;
			follow: (payload: User) => void; // 自分が他人をフォローしたとき
			followed: (payload: User) => void; // 他人が自分をフォローしたとき
			unfollow: (payload: User) => void; // 自分が他人をフォロー解除したとき
			meUpdated: (payload: MeDetailed) => void;
			pageEvent: (payload: PageEvent) => void;
			urlUploadFinished: (payload: { marker: string; file: DriveFile; }) => void;
			readAllNotifications: () => void;
			unreadNotification: () => void;
			unreadMention: () => void;
			readAllUnreadMentions: () => void;
			unreadSpecifiedNote: () => void;
			readAllUnreadSpecifiedNotes: () => void;
			readAllMessagingMessages: () => void;
			unreadMessagingMessage: () => void;
			readAllAntennas: () => void;
			unreadAntenna: () => void;
			readAllAnnouncements: () => void;
			readAllChannels: () => void;
			unreadChannel: () => void;
			myTokenRegenerated: () => void;
		};
	};
	homeTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
	};
	localTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
	};
	hybridTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
	};
	globalTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
	};
	messaging: {
		params: {
			otherparty?: User['id'] | null;
			group?: UserGroup['id'] | null;
		};
		events: {
			message: (payload: MessagingMessage) => void;
			deleted: (payload: MessagingMessage['id']) => void;
			read: (payload: MessagingMessage['id'][]) => void;
			typers: (payload: User[]) => void;
		};
	};
};

export type NoteUpdatedEvent = {
	id: Note['id'];
	type: 'reacted';
	body: {
		reaction: string;
		userId: User['id'];
	};
} | {
	id: Note['id'];
	type: 'deleted';
	body: {
		deletedAt: string;
	};
} | {
	id: Note['id'];
	type: 'pollVoted';
	body: {
		choice: number;
		userId: User['id'];
	};
};

export type BroadcasrEvents = {
	noteUpdated: (payload: NoteUpdatedEvent) => void;
	emojiAdded: (payload: {
		emoji: CustomEmoji;
	}) => void;
};
