import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import User, { isValidName, isValidDescription, isValidLocation, isValidBirthday, pack } from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import DriveFile from '../../../../models/drive-file';
import acceptAllFollowRequests from '../../../../services/following/requests/accept-all';
import { publishToFollowers } from '../../../../services/i/update';
import define from '../../define';
import getDriveFileUrl from '../../../../misc/get-drive-file-url';
import { parse, parsePlain } from '../../../../mfm/parse';
import extractEmojis from '../../../../misc/extract-emojis';
import extractHashtags from '../../../../misc/extract-hashtags';
import * as langmap from 'langmap';

export const meta = {
	desc: {
		'ja-JP': 'アカウント情報を更新します。',
		'en-US': 'Update myself'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		name: {
			validator: $.optional.nullable.str.pipe(isValidName),
			desc: {
				'ja-JP': '名前(ハンドルネームやニックネーム)'
			}
		},

		description: {
			validator: $.optional.nullable.str.pipe(isValidDescription),
			desc: {
				'ja-JP': 'アカウントの説明や自己紹介'
			}
		},

		lang: {
			validator: $.optional.nullable.str.or(Object.keys(langmap)),
			desc: {
				'ja-JP': '言語'
			}
		},

		location: {
			validator: $.optional.nullable.str.pipe(isValidLocation),
			desc: {
				'ja-JP': '住んでいる地域、所在'
			}
		},

		birthday: {
			validator: $.optional.nullable.str.pipe(isValidBirthday),
			desc: {
				'ja-JP': '誕生日 (YYYY-MM-DD形式)'
			}
		},

		avatarId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			desc: {
				'ja-JP': 'アイコンに設定する画像のドライブファイルID'
			}
		},

		bannerId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			desc: {
				'ja-JP': 'バナーに設定する画像のドライブファイルID'
			}
		},

		wallpaperId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '壁紙に設定する画像のドライブファイルID'
			}
		},

		isLocked: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '鍵アカウントか否か'
			}
		},

		carefulBot: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Botからのフォローを承認制にするか'
			}
		},

		autoAcceptFollowed: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'フォローしているユーザーからのフォローリクエストを自動承認するか'
			}
		},

		isBot: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Botか否か'
			}
		},

		isCat: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '猫か否か'
			}
		},

		autoWatch: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '投稿の自動ウォッチをするか否か'
			}
		},

		alwaysMarkNsfw: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'アップロードするメディアをデフォルトで「閲覧注意」として設定するか'
			}
		},
	}
};

export default define(meta, (ps, user, app) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	const updates = {} as any;

	if (ps.name !== undefined) updates.name = ps.name;
	if (ps.description !== undefined) updates.description = ps.description;
	if (ps.lang !== undefined) updates.lang = ps.lang;
	if (ps.location !== undefined) updates['profile.location'] = ps.location;
	if (ps.birthday !== undefined) updates['profile.birthday'] = ps.birthday;
	if (ps.avatarId !== undefined) updates.avatarId = ps.avatarId;
	if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;
	if (ps.wallpaperId !== undefined) updates.wallpaperId = ps.wallpaperId;
	if (typeof ps.isLocked == 'boolean') updates.isLocked = ps.isLocked;
	if (typeof ps.isBot == 'boolean') updates.isBot = ps.isBot;
	if (typeof ps.carefulBot == 'boolean') updates.carefulBot = ps.carefulBot;
	if (typeof ps.autoAcceptFollowed == 'boolean') updates.autoAcceptFollowed = ps.autoAcceptFollowed;
	if (typeof ps.isCat == 'boolean') updates.isCat = ps.isCat;
	if (typeof ps.autoWatch == 'boolean') updates['settings.autoWatch'] = ps.autoWatch;
	if (typeof ps.alwaysMarkNsfw == 'boolean') updates['settings.alwaysMarkNsfw'] = ps.alwaysMarkNsfw;

	if (ps.avatarId) {
		const avatar = await DriveFile.findOne({
			_id: ps.avatarId
		});

		if (avatar == null) return rej('avatar not found');
		if (!avatar.contentType.startsWith('image/')) return rej('avatar not an image');

		updates.avatarUrl = getDriveFileUrl(avatar, true);

		if (avatar.metadata.properties.avgColor) {
			updates.avatarColor = avatar.metadata.properties.avgColor;
		}
	}

	if (ps.bannerId) {
		const banner = await DriveFile.findOne({
			_id: ps.bannerId
		});

		if (banner == null) return rej('banner not found');
		if (!banner.contentType.startsWith('image/')) return rej('banner not an image');

		updates.bannerUrl = getDriveFileUrl(banner, false);

		if (banner.metadata.properties.avgColor) {
			updates.bannerColor = banner.metadata.properties.avgColor;
		}
	}

	if (ps.wallpaperId !== undefined) {
		if (ps.wallpaperId === null) {
			updates.wallpaperUrl = null;
			updates.wallpaperColor = null;
		} else {
			const wallpaper = await DriveFile.findOne({
				_id: ps.wallpaperId
			});

			if (wallpaper == null) return rej('wallpaper not found');

			updates.wallpaperUrl = getDriveFileUrl(wallpaper);

			if (wallpaper.metadata.properties.avgColor) {
				updates.wallpaperColor = wallpaper.metadata.properties.avgColor;
			}
		}
	}

	//#region emojis/tags
	if (updates.name != null || updates.description != null) {
		let emojis = [] as string[];
		let tags = [] as string[];

		if (updates.name != null) {
			const tokens = parsePlain(updates.name);
			emojis = emojis.concat(extractEmojis(tokens));
		}

		if (updates.description != null) {
			const tokens = parse(updates.description);
			emojis = emojis.concat(extractEmojis(tokens));
			tags = extractHashtags(tokens);
		}

		updates.emojis = emojis;
		updates.tags = tags;
	}
	//#endregion

	await User.update(user._id, {
		$set: updates
	});

	// Serialize
	const iObj = await pack(user._id, user, {
		detail: true,
		includeSecrets: isSecure
	});

	// Send response
	res(iObj);

	// Publish meUpdated event
	publishMainStream(user._id, 'meUpdated', iObj);

	// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
	if (user.isLocked && ps.isLocked === false) {
		acceptAllFollowRequests(user);
	}

	// フォロワーにUpdateを配信
	publishToFollowers(user._id);
}));
