export const notificationTypes = ['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export type pushNotificationData = {
	type: 'notification' | 'unreadMessagingMessage' | 'readNotifications' | 'readAllMessagingMessagesOfARoom' | 'readAllNotifications' | 'readAllMessagingMessages';
	body: {
		[x: string]: any;
		id?: string;
		type?: typeof notificationTypes[number];
		notificationIds?: string[];
		user?: any;
		userId?: string | null;
		note?: any;
		choice?: number;
		reaction?: string;
		invitation?: any;
	};
	userId: string;
};
