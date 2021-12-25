export const USER_ONLINE_THRESHOLD = 1000 * 60 * 10; // 10min
export const USER_ACTIVE_THRESHOLD = 1000 * 60 * 60 * 24 * 3; // 3days

// ブラウザで直接表示することを許可するファイルの種類のリスト
// ここに含まれないものは application/octet-stream としてレスポンスされる
// SVGはXSSを生むので許可しない
export const FILE_TYPE_WHITELIST = [
	'image/png',
	'image/gif',
	'image/jpeg',
	'image/webp',
	'image/apng',
	'image/bmp',
	'image/tiff',
	'image/x-icon',
	'video/mpeg',
	'video/mp4',
	'video/mp2t',
	'video/webm',
	'video/ogg',
	'video/3gpp',
	'video/quicktime',
	'video/x-m4v',
	'video/x-msvideo',
	'audio/mpeg',
	'audio/aac',
	'audio/wav',
	'audio/webm',
	'audio/ogg',
	'audio/x-m4a',
	'audio/x-flac',
	'application/ogg',
];
