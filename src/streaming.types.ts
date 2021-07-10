import { CustomEmoji, DriveFile, MeDetailed, MessagingMessage, Note, Notification, PageEvent, User, UserGroup } from './entities';

type FIXME = any;

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
		receives: null;
	};
	homeTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	localTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	hybridTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	globalTimeline: {
		params: null;
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
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
		receives: {
			read: {
				id: MessagingMessage['id'];
			};
		};
	};
	serverStats: {
		params: null;
		events: {
			stats: (payload: FIXME) => void;
		};
		receives: {
			requestLog: {
				id: string | number;
				length: number;
			};
		};
	};
	queueStats: {
		params: null;
		events: {
			stats: (payload: FIXME) => void;
		};
		receives: {
			requestLog: {
				id: string | number;
				length: number;
			};
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

export type BroadcastEvents = {
	noteUpdated: (payload: NoteUpdatedEvent) => void;
	emojiAdded: (payload: {
		emoji: CustomEmoji;
	}) => void;
};
