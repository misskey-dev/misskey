import {
	Antenna,
	DriveFile,
	DriveFolder,
	MeDetailed,
	Note,
	Notification,
	Signin,
	User,
} from './autogen/models.js';
import {
	AnnouncementCreated,
	EmojiAdded, EmojiDeleted,
	EmojiUpdated,
	PageEvent,
	QueueStats,
	QueueStatsLog,
	ServerStats,
	ServerStatsLog,
} from './entities.js';

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
			unreadNotification: (payload: Notification) => void;
			unreadMention: (payload: Note['id']) => void;
			readAllUnreadMentions: () => void;
			unreadSpecifiedNote: (payload: Note['id']) => void;
			readAllUnreadSpecifiedNotes: () => void;
			readAllAntennas: () => void;
			unreadAntenna: (payload: Antenna) => void;
			readAllAnnouncements: () => void;
			myTokenRegenerated: () => void;
			signin: (payload: Signin) => void;
			registryUpdated: (payload: {
				scope?: string[];
				key: string;
				value: any | null;
			}) => void;
			driveFileCreated: (payload: DriveFile) => void;
			readAntenna: (payload: Antenna) => void;
			receiveFollowRequest: (payload: User) => void;
			announcementCreated: (payload: AnnouncementCreated) => void;
		};
		receives: null;
	};
	homeTimeline: {
		params: {
			withRenotes?: boolean;
			withFiles?: boolean;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	localTimeline: {
		params: {
			withRenotes?: boolean;
			withReplies?: boolean;
			withFiles?: boolean;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	hybridTimeline: {
		params: {
			withRenotes?: boolean;
			withReplies?: boolean;
			withFiles?: boolean;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	globalTimeline: {
		params: {
			withRenotes?: boolean;
			withFiles?: boolean;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	userList: {
		params: {
			listId: string;
			withFiles?: boolean;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	hashtag: {
		params: {
			q?: string;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	roleTimeline: {
		params: {
			roleId: string;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	antenna: {
		params: {
			antennaId: string;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	channel: {
		params: {
			channelId: string;
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	drive: {
		params: null;
		events: {
			fileCreated: (payload: DriveFile) => void;
			fileDeleted: (payload: DriveFile['id']) => void;
			fileUpdated: (payload: DriveFile) => void;
			folderCreated: (payload: DriveFolder) => void;
			folderDeleted: (payload: DriveFolder['id']) => void;
			folderUpdated: (payload: DriveFile) => void;
		};
		receives: null;
	};
	serverStats: {
		params: null;
		events: {
			stats: (payload: ServerStats) => void;
			statsLog: (payload: ServerStatsLog) => void;
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
			stats: (payload: QueueStats) => void;
			statsLog: (payload: QueueStatsLog) => void;
		};
		receives: {
			requestLog: {
				id: string | number;
				length: number;
			};
		};
	};
	admin: {
		params: null;
		events: {
			newAbuseUserReport: {
				id: string;
				targetUserId: string;
				reporterId: string;
				comment: string;
			}
		};
		receives: null;
	}
};

export type NoteUpdatedEvent = {
	type: 'reacted';
	body: {
		reaction: string;
		emoji: string | null;
		userId: User['id'];
	};
} | {
	type: 'unreacted';
	body: {
		reaction: string;
		userId: User['id'];
	};
} | {
	type: 'deleted';
	body: {
		deletedAt: string;
	};
} | {
	type: 'pollVoted';
	body: {
		choice: number;
		userId: User['id'];
	};
};

export type BroadcastEvents = {
	noteUpdated: (payload: NoteUpdatedEvent) => void;
	emojiAdded: (payload: EmojiAdded) => void;
	emojiUpdated: (payload: EmojiUpdated) => void;
	emojiDeleted: (payload: EmojiDeleted) => void;
	announcementCreated: (payload: AnnouncementCreated) => void;
};
