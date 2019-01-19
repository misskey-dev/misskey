import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import User, { isValidName, isValidDescription, isValidLocation, isValidBirthday, pack } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import DriveFile from '../../../../models/drive-file';
import acceptAllFollowRequests from '../../../../services/following/requests/accept-all';
import { publishToFollowers } from '../../../../services/i/update';
import define from '../../define';
import getDriveFileUrl from '../../../../misc/get-drive-file-url';
import parse from '../../../../mfm/parse';
import extractEmojis from '../../../../misc/extract-emojis';
import { ObjectID } from 'mongodb';
import { error } from '../../../../prelude/promise';
const langmap = require('langmap');

export const meta = {
	desc: {
		'ja-JP': 'アカウント情報を更新します。',
		'en-US': 'Update myself'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		name: {
			validator: $.str.optional.nullable.pipe(isValidName),
			desc: {
				'ja-JP': '名前(ハンドルネームやニックネーム)'
			}
		},

		description: {
			validator: $.str.optional.nullable.pipe(isValidDescription),
			desc: {
				'ja-JP': 'アカウントの説明や自己紹介'
			}
		},

		lang: {
			validator: $.str.optional.nullable.or(Object.keys(langmap)),
			desc: {
				'ja-JP': '言語'
			}
		},

		location: {
			validator: $.str.optional.nullable.pipe(isValidLocation),
			locates: 'profile.location',
			desc: {
				'ja-JP': '住んでいる地域、所在'
			}
		},

		birthday: {
			validator: $.str.optional.nullable.pipe(isValidBirthday),
			locates: 'profile.birthday',
			desc: {
				'ja-JP': '誕生日 (YYYY-MM-DD形式)'
			}
		},

		avatarId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			desc: {
				'ja-JP': 'アイコンに設定する画像のドライブファイルID'
			}
		},

		bannerId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			desc: {
				'ja-JP': 'バナーに設定する画像のドライブファイルID'
			}
		},

		wallpaperId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			desc: {
				'ja-JP': '壁紙に設定する画像のドライブファイルID'
			}
		},

		isLocked: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': '鍵アカウントか否か'
			}
		},

		carefulBot: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'Botからのフォローを承認制にするか'
			}
		},

		isBot: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'Botか否か'
			}
		},

		isCat: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': '猫か否か'
			}
		},

		autoWatch: {
			validator: $.bool.optional,
			locates: 'settings.autoWatch',
			desc: {
				'ja-JP': '投稿の自動ウォッチをするか否か'
			}
		},

		alwaysMarkNsfw: {
			validator: $.bool.optional,
			locates: 'settings.alwaysMarkNsfw',
			desc: {
				'ja-JP': 'アップロードするメディアをデフォルトで「閲覧注意」として設定するか'
			}
		},
	}
};

const resolveImages = async (type: string, _id: ObjectID, checkType: boolean, reset: boolean) => reset && _id === null ? {
		[`${type}Url`]: null,
		[`${type}Color`]: null
	} : _id && await DriveFile.findOne({ _id })
		.then(x =>
			!x ? error(`${type} not found`) :
			checkType && !x.contentType.startsWith('image/') ? error(`${type} not an image`) : {
				[`${type}Url`]: getDriveFileUrl(x, true),
				[`${type}Color`]: x.metadata.properties.avgColor
			});

export default define(meta, (ps, user, app) => Object.entries({
		avatar: {
			id: ps.avatarId,
			checkType: true
		},
		banner: {
			id: ps.bannerId,
			checkType: true
		},
		wallpaper: {
			id: ps.wallpaperId,
			reset: true
		}
	}).reduce(
		async (a, [k, v]) => a.then(b => resolveImages(k, v.id, v.checkType, v.reset).then(x => Object.assign(b, x))),
		Promise.resolve(Object.entries(meta.params as {
			[x: string]: { locates?: string }
		}).reduce((a, [k, v]) => Object.assign(a, { [v.locates || k]: (ps as any)[k] }), {} as any)))
		.then($set => {
			const emojis = [
				...($set.name ? extractEmojis(parse($set.name, true)) : []),
				...($set.description ? extractEmojis(parse($set.description, true)) : [])
			];
			if (emojis.length) $set.emojis = emojis;
			return User.update(user._id, { $set });
		}).then(() => pack(user._id, user, {
			detail: true,
			includeSecrets: user && !app
		})).then(x => (
			publishMainStream(user._id, 'meUpdated', x),
			user.isLocked && ps.isLocked === false && acceptAllFollowRequests(user),
			publishToFollowers(user._id),
			x)));
