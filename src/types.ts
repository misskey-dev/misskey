export const notificationTypes = ['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export type pushNotificationData = {
    type: 'notification' | 'unreadMessagingMessage' | 'readNotifications' | 'readAllNotifications',
    body: any,
    userId: string
};
