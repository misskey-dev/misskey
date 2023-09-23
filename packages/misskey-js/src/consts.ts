export const notificationTypes = ['note', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export const ffVisibility = ['public', 'followers', 'private'] as const;

export const permissions = [
	'read:account',
	'write:account',
	'read:blocks',
	'write:blocks',
	'read:drive',
	'write:drive',
	'read:favorites',
	'write:favorites',
	'read:following',
	'write:following',
	'read:messaging',
	'write:messaging',
	'read:mutes',
	'write:mutes',
	'write:notes',
	'read:notifications',
	'write:notifications',
	'read:reactions',
	'write:reactions',
	'write:votes',
	'read:pages',
	'write:pages',
	'write:page-likes',
	'read:page-likes',
	'read:user-groups',
	'write:user-groups',
	'read:channels',
	'write:channels',
	'read:gallery',
	'write:gallery',
	'read:gallery-likes',
	'write:gallery-likes',
	'read:flash',
	'write:flash',
	'read:flash-likes',
	'write:flash-likes',
];

export const moderationLogTypes = [
	'updateServerSettings',
	'suspend',
	'unsuspend',
	'updateUserNote',
	'addCustomEmoji',
	'assignRole',
	'unassignRole',
	'updateRole',
	'deleteRole',
	'clearQueue',
	'promoteQueue',
	'deleteDriveFile',
	'deleteNote',
	'createGlobalAnnouncement',
	'createUserAnnouncement',
	'resetPassword',
	'suspendRemoteInstance',
	'unsuspendRemoteInstance',
] as const;

export type ModerationLogPayloads = {
	updateServerSettings: {
		before: any | null;
		after: any | null;
	};
	suspend: {
		targetId: string;
	};
	unsuspend: {
		targetId: string;
	};
	updateUserNote: {
		userId: string;
		before: string | null;
		after: string | null;
	};
	addCustomEmoji: {
		emojiId: string;
	};
	assignRole: {
		userId: string;
		roleId: string;
		roleName: string;
		expiresAt: string | null;
	};
	unassignRole: {
		userId: string;
		roleId: string;
		roleName: string;
	};
	updateRole: {
		roleId: string;
		before: any;
		after: any;
	};
	deleteRole: {
		roleId: string;
		roleName: string;
	};
	clearQueue: Record<string, never>;
	promoteQueue: Record<string, never>;
	deleteDriveFile: {
		fileId: string;
		fileUserId: string | null;
	};
	deleteNote: {
		noteId: string;
		noteUserId: string;
		note: any;
	};
	createGlobalAnnouncement: {
		announcementId: string;
		announcement: any;
	};
	createUserAnnouncement: {
		announcementId: string;
		announcement: any;
		userId: string;
	};
	resetPassword: {
		targetId: string;
	};
	suspendRemoteInstance: {
		id: string;
		host: string;
	};
	unsuspendRemoteInstance: {
		id: string;
		host: string;
	};
};
