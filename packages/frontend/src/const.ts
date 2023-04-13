// ブラウザで直接表示することを許可するファイルの種類のリスト
// ここに含まれないものは application/octet-stream としてレスポンスされる
// SVGはXSSを生むので許可しない
export const FILE_TYPE_BROWSERSAFE = [
	// Images
	'image/png',
	'image/gif',
	'image/jpeg',
	'image/webp',
	'image/avif',
	'image/apng',
	'image/bmp',
	'image/tiff',
	'image/x-icon',

	// OggS
	'audio/opus',
	'video/ogg',
	'audio/ogg',
	'application/ogg',

	// ISO/IEC base media file format
	'video/quicktime',
	'video/mp4',
	'audio/mp4',
	'video/x-m4v',
	'audio/x-m4a',
	'video/3gpp',
	'video/3gpp2',

	'video/mpeg',
	'audio/mpeg',

	'video/webm',
	'audio/webm',

	'audio/aac',
	'audio/x-flac',
	'audio/vnd.wave',
];
/*
https://github.com/sindresorhus/file-type/blob/main/supported.js
https://github.com/sindresorhus/file-type/blob/main/core.js
https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers
*/

export const notificationTypes = ['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app'] as const;
export const obsoleteNotificationTypes = ['pollVote', 'groupInvited'] as const;

export const ROLE_POLICIES = [
	'gtlAvailable',
	'ltlAvailable',
	'canPublicNote',
	'canInvite',
	'canManageCustomEmojis',
	'canSearchNotes',
	'canHideAds',
	'driveCapacityMb',
	'pinLimit',
	'antennaLimit',
	'wordMuteLimit',
	'webhookLimit',
	'clipLimit',
	'noteEachClipsLimit',
	'userListLimit',
	'userEachUserListsLimit',
	'rateLimitFactor',
] as const;

// なんか動かない
//export const CURRENT_STICKY_TOP = Symbol('CURRENT_STICKY_TOP');
//export const CURRENT_STICKY_BOTTOM = Symbol('CURRENT_STICKY_BOTTOM');
export const CURRENT_STICKY_TOP = 'CURRENT_STICKY_TOP';
export const CURRENT_STICKY_BOTTOM = 'CURRENT_STICKY_BOTTOM';
