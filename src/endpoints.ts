import { ID, InstanceMetadata, Note, OriginType, Page, ServerInfo, Stats, User, UserSorting } from './entities';

type TODO = Record<string, any>;

type ShowUserReq = { username: string; host?: string; } | { userId: ID; };

export type Endpoints = {
	// admin
	'admin/abuse-user-reports': { req: TODO; res: TODO; };
	'admin/delete-all-files-of-a-user': { req: TODO; res: TODO; };
	'admin/delete-logs': { req: TODO; res: TODO; };
	'admin/get-index-stats': { req: TODO; res: TODO; };
	'admin/get-table-stats': { req: TODO; res: TODO; };
	'admin/invite': { req: TODO; res: TODO; };
	'admin/logs': { req: TODO; res: TODO; };
	'admin/reset-password': { req: TODO; res: TODO; };
	'admin/resolve-abuse-user-report': { req: TODO; res: TODO; };
	'admin/resync-chart': { req: TODO; res: TODO; };
	'admin/send-email': { req: TODO; res: TODO; };
	'admin/server-info': { req: TODO; res: TODO; };
	'admin/show-moderation-logs': { req: TODO; res: TODO; };
	'admin/show-user': { req: TODO; res: TODO; };
	'admin/show-users': { req: TODO; res: TODO; };
	'admin/silence-user': { req: TODO; res: TODO; };
	'admin/suspend-user': { req: TODO; res: TODO; };
	'admin/unsilence-user': { req: TODO; res: TODO; };
	'admin/unsuspend-user': { req: TODO; res: TODO; };
	'admin/update-meta': { req: TODO; res: TODO; };
	'admin/vacuum': { req: TODO; res: TODO; };
	'admin/accounts/create': { req: TODO; res: TODO; };
	'admin/ad/create': { req: TODO; res: TODO; };
	'admin/ad/delete': { req: TODO; res: TODO; };
	'admin/ad/list': { req: TODO; res: TODO; };
	'admin/ad/update': { req: TODO; res: TODO; };
	'admin/announcements/create': { req: TODO; res: TODO; };
	'admin/announcements/delete': { req: TODO; res: TODO; };
	'admin/announcements/list': { req: TODO; res: TODO; };
	'admin/announcements/update': { req: TODO; res: TODO; };
	'admin/drive/clean-remote-files': { req: TODO; res: TODO; };
	'admin/drive/cleanup': { req: TODO; res: TODO; };
	'admin/drive/files': { req: TODO; res: TODO; };
	'admin/drive/show-file': { req: TODO; res: TODO; };
	'admin/emoji/add': { req: TODO; res: TODO; };
	'admin/emoji/copy': { req: TODO; res: TODO; };
	'admin/emoji/list-remote': { req: TODO; res: TODO; };
	'admin/emoji/list': { req: TODO; res: TODO; };
	'admin/emoji/remove': { req: TODO; res: TODO; };
	'admin/emoji/update': { req: TODO; res: TODO; };
	'admin/federation/delete-all-files': { req: TODO; res: TODO; };
	'admin/federation/refresh-remote-instance-metadata': { req: TODO; res: TODO; };
	'admin/federation/remove-all-following': { req: TODO; res: TODO; };
	'admin/federation/update-instance': { req: TODO; res: TODO; };
	'admin/moderators/add': { req: TODO; res: TODO; };
	'admin/moderators/remove': { req: TODO; res: TODO; };
	'admin/promo/create': { req: TODO; res: TODO; };
	'admin/queue/clear': { req: TODO; res: TODO; };
	'admin/queue/deliver-delayed': { req: TODO; res: TODO; };
	'admin/queue/inbox-delayed': { req: TODO; res: TODO; };
	'admin/queue/jobs': { req: TODO; res: TODO; };
	'admin/queue/stats': { req: TODO; res: TODO; };
	'admin/relays/add': { req: TODO; res: TODO; };
	'admin/relays/list': { req: TODO; res: TODO; };
	'admin/relays/remove': { req: TODO; res: TODO; };

	// announcements
	'announcements': { req: { limit?: number; withUnreads?: boolean; sinceId?: ID; untilId?: ID; }; res: TODO; };

	// antennas
	'antennas/create': { req: TODO; res: TODO; };
	'antennas/delete': { req: TODO; res: TODO; };
	'antennas/list': { req: TODO; res: TODO; };
	'antennas/notes': { req: TODO; res: TODO; };
	'antennas/show': { req: TODO; res: TODO; };
	'antennas/update': { req: TODO; res: TODO; };

	// ap
	'ap/get': { req: TODO; res: TODO; };
	'ap/show': { req: TODO; res: TODO; };

	// app
	'app/create': { req: TODO; res: TODO; };
	'app/show': { req: TODO; res: TODO; };

	// auth
	'auth/accept': { req: TODO; res: TODO; };
	'auth/session/generate': { req: TODO; res: TODO; };
	'auth/session/show': { req: TODO; res: TODO; };
	'auth/session/userkey': { req: TODO; res: TODO; };

	// blocking
	'blocking/create': { req: TODO; res: TODO; };
	'blocking/delete': { req: TODO; res: TODO; };
	'blocking/list': { req: TODO; res: TODO; };

	// channels
	'channels/create': { req: TODO; res: TODO; };
	'channels/featured': { req: TODO; res: TODO; };
	'channels/follow': { req: TODO; res: TODO; };
	'channels/followed': { req: TODO; res: TODO; };
	'channels/owned': { req: TODO; res: TODO; };
	'channels/pin-note': { req: TODO; res: TODO; };
	'channels/show': { req: TODO; res: TODO; };
	'channels/timeline': { req: TODO; res: TODO; };
	'channels/unfollow': { req: TODO; res: TODO; };
	'channels/update': { req: TODO; res: TODO; };

	// charts
	'charts/active-users': { req: TODO; res: TODO; };
	'charts/drive': { req: TODO; res: TODO; };
	'charts/federation': { req: TODO; res: TODO; };
	'charts/hashtag': { req: TODO; res: TODO; };
	'charts/instance': { req: TODO; res: TODO; };
	'charts/network': { req: TODO; res: TODO; };
	'charts/notes': { req: TODO; res: TODO; };
	'charts/user/drive': { req: TODO; res: TODO; };
	'charts/user/following': { req: TODO; res: TODO; };
	'charts/user/notes': { req: TODO; res: TODO; };
	'charts/user/reactions': { req: TODO; res: TODO; };
	'charts/users': { req: TODO; res: TODO; };

	// clips
	'clips/add-note': { req: TODO; res: TODO; };
	'clips/create': { req: TODO; res: TODO; };
	'clips/delete': { req: TODO; res: TODO; };
	'clips/list': { req: TODO; res: TODO; };
	'clips/notes': { req: TODO; res: TODO; };
	'clips/show': { req: TODO; res: TODO; };
	'clips/update': { req: TODO; res: TODO; };

	// drive
	'drive': { req: null; res: { capacity: number; usage: number; }; };
	'drive/files': { req: TODO; res: TODO; };
	'drive/files/attached-notes': { req: TODO; res: TODO; };
	'drive/files/check-existence': { req: TODO; res: TODO; };
	'drive/files/create': { req: TODO; res: TODO; };
	'drive/files/delete': { req: TODO; res: TODO; };
	'drive/files/find-by-hash': { req: TODO; res: TODO; };
	'drive/files/find': { req: TODO; res: TODO; };
	'drive/files/show': { req: TODO; res: TODO; };
	'drive/files/update': { req: TODO; res: TODO; };
	'drive/files/upload-from-url': { req: TODO; res: TODO; };
	'drive/folders': { req: TODO; res: TODO; };
	'drive/folders/create': { req: TODO; res: TODO; };
	'drive/folders/delete': { req: TODO; res: TODO; };
	'drive/folders/find': { req: TODO; res: TODO; };
	'drive/folders/show': { req: TODO; res: TODO; };
	'drive/folders/update': { req: TODO; res: TODO; };
	'drive/stream': { req: TODO; res: TODO; };

	// federation
	'federation/dns': { req: TODO; res: TODO; };
	'federation/followers': { req: TODO; res: TODO; };
	'federation/following': { req: TODO; res: TODO; };
	'federation/instances': { req: TODO; res: TODO; };
	'federation/show-instance': { req: TODO; res: TODO; };
	'federation/update-remote-user': { req: TODO; res: TODO; };
	'federation/users': { req: TODO; res: TODO; };

	// following
	'following/create': { req: TODO; res: TODO; };
	'following/delete': { req: TODO; res: TODO; };
	'following/requests/accept': { req: TODO; res: TODO; };
	'following/requests/cancel': { req: TODO; res: TODO; };
	'following/requests/list': { req: TODO; res: TODO; };
	'following/requests/reject': { req: TODO; res: TODO; };

	// gallery
	'gallery/featured': { req: TODO; res: TODO; };
	'gallery/popular': { req: TODO; res: TODO; };
	'gallery/posts': { req: TODO; res: TODO; };
	'gallery/posts/create': { req: TODO; res: TODO; };
	'gallery/posts/delete': { req: TODO; res: TODO; };
	'gallery/posts/like': { req: TODO; res: TODO; };
	'gallery/posts/show': { req: TODO; res: TODO; };
	'gallery/posts/unlike': { req: TODO; res: TODO; };
	'gallery/posts/update': { req: TODO; res: TODO; };

	// games
	'games/reversi/games': { req: TODO; res: TODO; };
	'games/reversi/games/show': { req: TODO; res: TODO; };
	'games/reversi/games/surrender': { req: TODO; res: TODO; };
	'games/reversi/invitations': { req: TODO; res: TODO; };
	'games/reversi/match': { req: TODO; res: TODO; };
	'games/reversi/match/cancel': { req: TODO; res: TODO; };

	// get-online-users-count
	'get-online-users-count': { req: TODO; res: TODO; };

	// hashtags
	'hashtags/list': { req: TODO; res: TODO; };
	'hashtags/search': { req: TODO; res: TODO; };
	'hashtags/show': { req: TODO; res: TODO; };
	'hashtags/trend': { req: TODO; res: TODO; };
	'hashtags/users': { req: TODO; res: TODO; };

	// i
	'i': { req: TODO; res: User; };
	'i/apps': { req: TODO; res: TODO; };
	'i/authorized-apps': { req: TODO; res: TODO; };
	'i/change-password': { req: TODO; res: TODO; };
	'i/delete-account': { req: TODO; res: TODO; };
	'i/export-blocking': { req: TODO; res: TODO; };
	'i/export-following': { req: TODO; res: TODO; };
	'i/export-mute': { req: TODO; res: TODO; };
	'i/export-notes': { req: TODO; res: TODO; };
	'i/export-user-lists': { req: TODO; res: TODO; };
	'i/favorites': { req: TODO; res: TODO; };
	'i/gallery/likes': { req: TODO; res: TODO; };
	'i/gallery/posts': { req: TODO; res: TODO; };
	'i/get-word-muted-notes-count': { req: TODO; res: TODO; };
	'i/import-following': { req: TODO; res: TODO; };
	'i/import-user-lists': { req: TODO; res: TODO; };
	'i/notifications': { req: TODO; res: TODO; };
	'i/page-likes': { req: TODO; res: TODO; };
	'i/pages': { req: TODO; res: TODO; };
	'i/pin': { req: TODO; res: TODO; };
	'i/read-all-messaging-messages': { req: TODO; res: TODO; };
	'i/read-all-unread-notes': { req: TODO; res: TODO; };
	'i/read-announcement': { req: TODO; res: TODO; };
	'i/regenerate-token': { req: TODO; res: TODO; };
	'i/registry/get-all': { req: TODO; res: TODO; };
	'i/registry/get-detail': { req: TODO; res: TODO; };
	'i/registry/get': { req: TODO; res: TODO; };
	'i/registry/keys-with-type': { req: TODO; res: TODO; };
	'i/registry/keys': { req: TODO; res: TODO; };
	'i/registry/remove': { req: TODO; res: TODO; };
	'i/registry/scopes': { req: TODO; res: TODO; };
	'i/registry/set': { req: TODO; res: TODO; };
	'i/revoke-token': { req: TODO; res: TODO; };
	'i/signin-history': { req: TODO; res: TODO; };
	'i/unpin': { req: TODO; res: TODO; };
	'i/update-email': { req: TODO; res: TODO; };
	'i/update': { req: TODO; res: TODO; };
	'i/user-group-invites': { req: TODO; res: TODO; };
	'i/2fa/done': { req: TODO; res: TODO; };
	'i/2fa/key-done': { req: TODO; res: TODO; };
	'i/2fa/password-less': { req: TODO; res: TODO; };
	'i/2fa/register-key': { req: TODO; res: TODO; };
	'i/2fa/register': { req: TODO; res: TODO; };
	'i/2fa/remove-key': { req: TODO; res: TODO; };
	'i/2fa/unregister': { req: TODO; res: TODO; };

	// messaging
	'messaging/history': { req: TODO; res: TODO; };
	'messaging/messages': { req: TODO; res: TODO; };
	'messaging/messages/create': { req: TODO; res: TODO; };
	'messaging/messages/delete': { req: TODO; res: TODO; };
	'messaging/messages/read': { req: TODO; res: TODO; };

	// meta
	'meta': { req: { detail?: boolean; }; res: InstanceMetadata; };

	// miauth
	'miauth/gen-token': { req: TODO; res: TODO; };

	// mute
	'mute/create': { req: TODO; res: TODO; };
	'mute/delete': { req: TODO; res: TODO; };
	'mute/list': { req: TODO; res: TODO; };

	// my
	'my/apps': { req: TODO; res: TODO; };

	// notes
	'notes': { req: { limit?: number; sinceId?: ID; untilId?: ID; }; res: Note[]; };
	'notes/children': { req: TODO; res: TODO; };
	'notes/clips': { req: TODO; res: TODO; };
	'notes/conversation': { req: TODO; res: TODO; };
	'notes/create': { req: TODO; res: { createdNote: Note }; };
	'notes/delete': { req: { noteId: ID; }; res: null; };
	'notes/favorites/create': { req: TODO; res: TODO; };
	'notes/favorites/delete': { req: TODO; res: TODO; };
	'notes/featured': { req: TODO; res: TODO; };
	'notes/global-timeline': { req: TODO; res: TODO; };
	'notes/hybrid-timeline': { req: TODO; res: TODO; };
	'notes/local-timeline': { req: TODO; res: TODO; };
	'notes/mentions': { req: TODO; res: TODO; };
	'notes/polls/recommendation': { req: TODO; res: TODO; };
	'notes/polls/vote': { req: TODO; res: TODO; };
	'notes/reactions': { req: TODO; res: TODO; };
	'notes/reactions/create': { req: TODO; res: TODO; };
	'notes/reactions/delete': { req: TODO; res: TODO; };
	'notes/renotes': { req: TODO; res: TODO; };
	'notes/replies': { req: TODO; res: TODO; };
	'notes/search-by-tag': { req: TODO; res: TODO; };
	'notes/search': { req: TODO; res: TODO; };
	'notes/show': { req: { noteId: ID; }; res: Note; };
	'notes/state': { req: TODO; res: TODO; };
	'notes/timeline': { req: TODO; res: TODO; };
	'notes/unrenote': { req: TODO; res: TODO; };
	'notes/user-list-timeline': { req: TODO; res: TODO; };
	'notes/watching/create': { req: TODO; res: TODO; };
	'notes/watching/delete': { req: TODO; res: TODO; };

	// notifications
	'notifications/create': { req: TODO; res: TODO; };
	'notifications/mark-all-as-read': { req: TODO; res: TODO; };
	'notifications/read': { req: TODO; res: TODO; };

	// page-push
	'page-push': { req: { pageId: ID; event: string; var?: any; }; res: null; };

	// pages
	'pages/create': { req: TODO; res: Page; };
	'pages/delete': { req: { pageId: ID; }; res: null; };
	'pages/featured': { req: null; res: Page[]; };
	'pages/like': { req: { pageId: ID; }; res: null; };
	'pages/show': { req: { pageId?: ID; name?: string; username?: string; }; res: Page; };
	'pages/unlike': { req: { pageId: ID; }; res: null; };
	'pages/update': { req: TODO; res: null; };

	// ping
	'ping': { req: TODO; res: TODO; };

	// pinned-users
	'pinned-users': { req: TODO; res: TODO; };

	// promo
	'promo/read': { req: TODO; res: TODO; };

	// request-reset-password
	'request-reset-password': { req: TODO; res: TODO; };

	// reset-password
	'reset-password': { req: { token: string; password: string; }; res: null; };

	// room
	'room/show': { req: TODO; res: TODO; };
	'room/update': { req: TODO; res: TODO; };

	// stats
	'stats': { req: null; res: Stats; };

	// server-info
	'server-info': { req: null; res: ServerInfo; };

	// sw
	'sw/register': { req: TODO; res: TODO; };

	// username
	'username/available': { req: TODO; res: TODO; };

	// users
	'users': { req: { limit?: number; offset?: number; sort?: UserSorting; origin?: OriginType; }; res: User[]; };
	'users/clips': { req: TODO; res: TODO; };
	'users/followers': { req: TODO; res: TODO; };
	'users/following': { req: TODO; res: TODO; };
	'users/gallery/posts': { req: TODO; res: TODO; };
	'users/get-frequently-replied-users': { req: TODO; res: TODO; };
	'users/groups/create': { req: TODO; res: TODO; };
	'users/groups/delete': { req: TODO; res: TODO; };
	'users/groups/invitations/accept': { req: TODO; res: TODO; };
	'users/groups/invitations/reject': { req: TODO; res: TODO; };
	'users/groups/invite': { req: TODO; res: TODO; };
	'users/groups/joined': { req: TODO; res: TODO; };
	'users/groups/owned': { req: TODO; res: TODO; };
	'users/groups/pull': { req: TODO; res: TODO; };
	'users/groups/show': { req: TODO; res: TODO; };
	'users/groups/transfer': { req: TODO; res: TODO; };
	'users/groups/update': { req: TODO; res: TODO; };
	'users/lists/create': { req: TODO; res: TODO; };
	'users/lists/delete': { req: TODO; res: TODO; };
	'users/lists/list': { req: TODO; res: TODO; };
	'users/lists/pull': { req: TODO; res: TODO; };
	'users/lists/push': { req: TODO; res: TODO; };
	'users/lists/show': { req: TODO; res: TODO; };
	'users/lists/update': { req: TODO; res: TODO; };
	'users/notes': { req: TODO; res: TODO; };
	'users/pages': { req: TODO; res: TODO; };
	'users/recommendation': { req: TODO; res: TODO; };
	'users/relation': { req: TODO; res: TODO; };
	'users/report-abuse': { req: TODO; res: TODO; };
	'users/search-by-username-and-host': { req: TODO; res: TODO; };
	'users/search': { req: TODO; res: TODO; };
	'users/show': { req: ShowUserReq; res: User; } | { req: { userIds: ID[]; }; res: User[]; };
	'users/stats': { req: TODO; res: TODO; };
};
