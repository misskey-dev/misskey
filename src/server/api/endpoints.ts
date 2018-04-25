const ms = require('ms');

/**
 * エンドポイントを表します。
 */
export type Endpoint = {

	/**
	 * エンドポイント名
	 */
	name: string;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	withCredential?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 * また、withCredential が false の場合はリミテーションを行うことはできません。
	 */
	limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	withFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	kind?: string;
};

const endpoints: Endpoint[] = [
	{
		name: 'meta'
	},
	{
		name: 'stats'
	},
	{
		name: 'username/available'
	},
	{
		name: 'my/apps',
		withCredential: true
	},
	{
		name: 'app/create',
		withCredential: true,
		limit: {
			duration: ms('1day'),
			max: 3
		}
	},
	{
		name: 'app/show'
	},
	{
		name: 'app/name_id/available'
	},
	{
		name: 'auth/session/generate'
	},
	{
		name: 'auth/session/show'
	},
	{
		name: 'auth/session/userkey'
	},
	{
		name: 'auth/accept',
		withCredential: true,
		secure: true
	},
	{
		name: 'auth/deny',
		withCredential: true,
		secure: true
	},
	{
		name: 'aggregation/notes',
	},
	{
		name: 'aggregation/users',
	},
	{
		name: 'aggregation/users/activity',
	},
	{
		name: 'aggregation/users/note',
	},
	{
		name: 'aggregation/users/followers'
	},
	{
		name: 'aggregation/users/following'
	},
	{
		name: 'aggregation/users/reaction'
	},
	{
		name: 'aggregation/notes/renote'
	},
	{
		name: 'aggregation/notes/reply'
	},
	{
		name: 'aggregation/notes/reaction'
	},
	{
		name: 'aggregation/notes/reactions'
	},

	{
		name: 'sw/register',
		withCredential: true
	},

	{
		name: 'i',
		withCredential: true
	},
	{
		name: 'i/2fa/register',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/2fa/unregister',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/2fa/done',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/update',
		withCredential: true,
		limit: {
			duration: ms('1day'),
			max: 50
		},
		kind: 'account-write'
	},
	{
		name: 'i/update_home',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/update_mobile_home',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/change_password',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/regenerate_token',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/update_client_setting',
		withCredential: true,
		secure: true
	},
	{
		name: 'i/pin',
		kind: 'account-write'
	},
	{
		name: 'i/appdata/get',
		withCredential: true
	},
	{
		name: 'i/appdata/set',
		withCredential: true
	},
	{
		name: 'i/signin_history',
		withCredential: true,
		kind: 'account-read'
	},
	{
		name: 'i/authorized_apps',
		withCredential: true,
		secure: true
	},

	{
		name: 'i/notifications',
		withCredential: true,
		kind: 'notification-read'
	},

	{
		name: 'i/favorites',
		withCredential: true,
		kind: 'favorites-read'
	},

	{
		name: 'othello/match',
		withCredential: true
	},

	{
		name: 'othello/match/cancel',
		withCredential: true
	},

	{
		name: 'othello/invitations',
		withCredential: true
	},

	{
		name: 'othello/games',
		withCredential: true
	},

	{
		name: 'othello/games/show'
	},

	{
		name: 'mute/create',
		withCredential: true,
		kind: 'account/write'
	},
	{
		name: 'mute/delete',
		withCredential: true,
		kind: 'account/write'
	},
	{
		name: 'mute/list',
		withCredential: true,
		kind: 'account/read'
	},

	{
		name: 'notifications/get_unread_count',
		withCredential: true,
		kind: 'notification-read'
	},
	{
		name: 'notifications/delete',
		withCredential: true,
		kind: 'notification-write'
	},
	{
		name: 'notifications/delete_all',
		withCredential: true,
		kind: 'notification-write'
	},
	{
		name: 'notifications/mark_as_read_all',
		withCredential: true,
		kind: 'notification-write'
	},

	{
		name: 'drive',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/stream',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/files',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/files/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		withFile: true,
		kind: 'drive-write'
	},
	{
		name: 'drive/files/upload_from_url',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 10
		},
		kind: 'drive-write'
	},
	{
		name: 'drive/files/show',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/files/find',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/files/delete',
		withCredential: true,
		kind: 'drive-write'
	},
	{
		name: 'drive/files/update',
		withCredential: true,
		kind: 'drive-write'
	},
	{
		name: 'drive/folders',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/folders/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 50
		},
		kind: 'drive-write'
	},
	{
		name: 'drive/folders/show',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/folders/find',
		withCredential: true,
		kind: 'drive-read'
	},
	{
		name: 'drive/folders/update',
		withCredential: true,
		kind: 'drive-write'
	},

	{
		name: 'users'
	},
	{
		name: 'users/show'
	},
	{
		name: 'users/search'
	},
	{
		name: 'users/search_by_username'
	},
	{
		name: 'users/notes'
	},
	{
		name: 'users/following'
	},
	{
		name: 'users/followers'
	},
	{
		name: 'users/recommendation',
		withCredential: true,
		kind: 'account-read'
	},
	{
		name: 'users/get_frequently_replied_users'
	},

	{
		name: 'users/lists/show',
		withCredential: true,
		kind: 'account-read'
	},
	{
		name: 'users/lists/create',
		withCredential: true,
		kind: 'account-write'
	},
	{
		name: 'users/lists/push',
		withCredential: true,
		kind: 'account-write'
	},
	{
		name: 'users/lists/list',
		withCredential: true,
		kind: 'account-read'
	},

	{
		name: 'following/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'following-write'
	},
	{
		name: 'following/delete',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'following-write'
	},
	{
		name: 'following/stalk',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'following-write'
	},
	{
		name: 'following/unstalk',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'following-write'
	},

	{
		name: 'notes'
	},
	{
		name: 'notes/show'
	},
	{
		name: 'notes/replies'
	},
	{
		name: 'notes/context'
	},
	{
		name: 'notes/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 120,
			minInterval: ms('1second')
		},
		kind: 'note-write'
	},
	{
		name: 'notes/renotes'
	},
	{
		name: 'notes/search'
	},
	{
		name: 'notes/timeline',
		withCredential: true,
		limit: {
			duration: ms('10minutes'),
			max: 100
		}
	},
	{
		name: 'notes/local-timeline',
		withCredential: true,
		limit: {
			duration: ms('10minutes'),
			max: 100
		}
	},
	{
		name: 'notes/global-timeline',
		withCredential: true,
		limit: {
			duration: ms('10minutes'),
			max: 100
		}
	},
	{
		name: 'notes/user-list-timeline',
		withCredential: true,
		limit: {
			duration: ms('10minutes'),
			max: 100
		}
	},
	{
		name: 'notes/mentions',
		withCredential: true,
		limit: {
			duration: ms('10minutes'),
			max: 100
		}
	},
	{
		name: 'notes/trend',
		withCredential: true
	},
	{
		name: 'notes/categorize',
		withCredential: true
	},
	{
		name: 'notes/reactions',
		withCredential: true
	},
	{
		name: 'notes/reactions/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'reaction-write'
	},
	{
		name: 'notes/reactions/delete',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'reaction-write'
	},
	{
		name: 'notes/favorites/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'favorite-write'
	},
	{
		name: 'notes/favorites/delete',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'favorite-write'
	},
	{
		name: 'notes/polls/vote',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 100
		},
		kind: 'vote-write'
	},
	{
		name: 'notes/polls/recommendation',
		withCredential: true
	},

	{
		name: 'messaging/history',
		withCredential: true,
		kind: 'messaging-read'
	},
	{
		name: 'messaging/unread',
		withCredential: true,
		kind: 'messaging-read'
	},
	{
		name: 'messaging/messages',
		withCredential: true,
		kind: 'messaging-read'
	},
	{
		name: 'messaging/messages/create',
		withCredential: true,
		kind: 'messaging-write'
	},
	{
		name: 'channels/create',
		withCredential: true,
		limit: {
			duration: ms('1hour'),
			max: 3,
			minInterval: ms('10seconds')
		}
	},
	{
		name: 'channels/show'
	},
	{
		name: 'channels/notes'
	},
	{
		name: 'channels/watch',
		withCredential: true
	},
	{
		name: 'channels/unwatch',
		withCredential: true
	},
	{
		name: 'channels'
	},
];

export default endpoints;
