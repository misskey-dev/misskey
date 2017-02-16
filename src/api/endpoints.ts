const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

export interface IEndpoint {
	name: string;
	shouldBeSignin: boolean;
	limitKey?: string;
	limitDuration?: number;
	limitMax?: number;
	minInterval?: number;
	withFile?: boolean;
	secure?: boolean;
	kind?: string;
}

export default [
	{ name: 'meta',   shouldBeSignin: false },

	{ name: 'username/available', shouldBeSignin: false },

	{ name: 'my/apps', shouldBeSignin: true },

	{ name: 'app/create',            shouldBeSignin: true, limitDuration: day, limitMax: 3 },
	{ name: 'app/show',              shouldBeSignin: false },
	{ name: 'app/name_id/available', shouldBeSignin: false },

	{ name: 'auth/session/generate', shouldBeSignin: false },
	{ name: 'auth/session/show',     shouldBeSignin: false },
	{ name: 'auth/session/userkey',  shouldBeSignin: false },
	{ name: 'auth/accept',           shouldBeSignin: true, secure: true },
	{ name: 'auth/deny',             shouldBeSignin: true, secure: true },

	{ name: 'aggregation/users/post',      shouldBeSignin: false },
	{ name: 'aggregation/users/like',      shouldBeSignin: false },
	{ name: 'aggregation/users/followers', shouldBeSignin: false },
	{ name: 'aggregation/users/following', shouldBeSignin: false },
	{ name: 'aggregation/posts/like',      shouldBeSignin: false },
	{ name: 'aggregation/posts/likes',     shouldBeSignin: false },
	{ name: 'aggregation/posts/repost',    shouldBeSignin: false },
	{ name: 'aggregation/posts/reply',     shouldBeSignin: false },

	{ name: 'i',                shouldBeSignin: true },
	{ name: 'i/update',         shouldBeSignin: true, limitDuration: day, limitMax: 50, kind: 'account-write' },
	{ name: 'i/appdata/get',    shouldBeSignin: true },
	{ name: 'i/appdata/set',    shouldBeSignin: true },
	{ name: 'i/signin_history', shouldBeSignin: true, kind: 'account-read' },
	{ name: 'i/authorized_apps', shouldBeSignin: true, secure: true },

	{ name: 'i/notifications',                shouldBeSignin: true, kind: 'notification-read' },
	{ name: 'notifications/delete',           shouldBeSignin: true, kind: 'notification-write' },
	{ name: 'notifications/delete_all',       shouldBeSignin: true, kind: 'notification-write' },
	{ name: 'notifications/mark_as_read',     shouldBeSignin: true, kind: 'notification-write' },
	{ name: 'notifications/mark_as_read_all', shouldBeSignin: true, kind: 'notification-write' },

	{ name: 'drive',                       shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/stream',                shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/files',                 shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/files/create',          shouldBeSignin: true, limitDuration: hour, limitMax: 100, withFile: true, kind: 'drive-write' },
	{ name: 'drive/files/upload_from_url', shouldBeSignin: true, limitDuration: hour, limitMax: 10, kind: 'drive-write' },
	{ name: 'drive/files/show',            shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/files/find',            shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/files/delete',          shouldBeSignin: true, kind: 'drive-write' },
	{ name: 'drive/files/update',          shouldBeSignin: true, kind: 'drive-write' },
	{ name: 'drive/folders',               shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/folders/create',        shouldBeSignin: true, limitDuration: hour, limitMax: 50, kind: 'drive-write' },
	{ name: 'drive/folders/show',          shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/folders/find',          shouldBeSignin: true, kind: 'drive-read' },
	{ name: 'drive/folders/update',        shouldBeSignin: true, kind: 'drive-write' },

	{ name: 'users',                    shouldBeSignin: false },
	{ name: 'users/show',               shouldBeSignin: false },
	{ name: 'users/search',             shouldBeSignin: false },
	{ name: 'users/search_by_username', shouldBeSignin: false },
	{ name: 'users/posts',              shouldBeSignin: false },
	{ name: 'users/following',          shouldBeSignin: false },
	{ name: 'users/followers',          shouldBeSignin: false },
	{ name: 'users/recommendation',     shouldBeSignin: true, kind: 'account-read' },

	{ name: 'following/create', shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'following-write' },
	{ name: 'following/delete', shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'following-write' },

	{ name: 'posts/show',             shouldBeSignin: false },
	{ name: 'posts/replies',          shouldBeSignin: false },
	{ name: 'posts/context',          shouldBeSignin: false },
	{ name: 'posts/create',           shouldBeSignin: true, limitDuration: hour, limitMax: 120, minInterval: 1 * second, kind: 'post-write' },
	{ name: 'posts/reposts',          shouldBeSignin: false },
	{ name: 'posts/search',           shouldBeSignin: false },
	{ name: 'posts/timeline',         shouldBeSignin: true, limitDuration: 10 * minute, limitMax: 100 },
	{ name: 'posts/mentions',         shouldBeSignin: true, limitDuration: 10 * minute, limitMax: 100 },
	{ name: 'posts/likes',            shouldBeSignin: true },
	{ name: 'posts/likes/create',     shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'like-write' },
	{ name: 'posts/likes/delete',     shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'like-write' },
	{ name: 'posts/favorites/create', shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'favorite-write' },
	{ name: 'posts/favorites/delete', shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'favorite-write' },
	{ name: 'posts/polls/vote',       shouldBeSignin: true, limitDuration: hour, limitMax: 100, kind: 'vote-write' },

	{ name: 'messaging/history',         shouldBeSignin: true, kind: 'messaging-read' },
	{ name: 'messaging/unread',          shouldBeSignin: true, kind: 'messaging-read' },
	{ name: 'messaging/messages',        shouldBeSignin: true, kind: 'messaging-read' },
	{ name: 'messaging/messages/create', shouldBeSignin: true, kind: 'messaging-write' }

] as IEndpoint[];
