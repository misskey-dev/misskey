import $ from 'cafy'; import ID, { transform, transformMany } from '../../../../misc/cafy-id';
const ms = require('ms');
import { length } from 'stringz';
import Note, { isValidCw, pack } from '../../../../models/note';
import User from '../../../../models/user';
import DriveFile from '../../../../models/drive-file';
import create from '../../../../services/note/create';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import { ObjectID } from 'mongodb';
import { error } from '../../../../prelude/promise';

let maxNoteTextLength = 1000;

setInterval(() => {
	fetchMeta().then(m => {
		maxNoteTextLength = m.maxNoteTextLength;
	});
}, 3000);

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '投稿します。'
	},

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	kind: 'note-write',

	params: {
		visibility: {
			validator: $.str.optional.or(['public', 'home', 'followers', 'specified', 'private']),
			default: 'public',
			desc: {
				'ja-JP': '投稿の公開範囲'
			}
		},

		visibleUserIds: {
			validator: $.arr($.type(ID)).optional.unique().min(0),
			transform: transformMany,
			desc: {
				'ja-JP': '(投稿の公開範囲が specified の場合)投稿を閲覧できるユーザー'
			}
		},

		text: {
			validator: $.str.optional.nullable.pipe(text =>
				length(text.trim()) <= maxNoteTextLength && text.trim() != ''
			),
			default: null as any,
			desc: {
				'ja-JP': '投稿内容'
			}
		},

		cw: {
			validator: $.str.optional.nullable.pipe(isValidCw),
			desc: {
				'ja-JP': 'コンテンツの警告。このパラメータを指定すると設定したテキストで投稿のコンテンツを隠す事が出来ます。'
			}
		},

		viaMobile: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'モバイルデバイスからの投稿か否か。'
			}
		},

		localOnly: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'ローカルのみに投稿か否か。'
			}
		},

		noExtractMentions: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': '本文からメンションを展開しないか否か。'
			}
		},

		noExtractHashtags: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': '本文からハッシュタグを展開しないか否か。'
			}
		},

		noExtractEmojis: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': '本文からカスタム絵文字を展開しないか否か。'
			}
		},

		geo: {
			validator: $.obj({
				coordinates: $.arr().length(2)
					.item(0, $.num.range(-180, 180))
					.item(1, $.num.range(-90, 90)),
				altitude: $.num.nullable,
				accuracy: $.num.nullable,
				altitudeAccuracy: $.num.nullable,
				heading: $.num.nullable.range(0, 360),
				speed: $.num.nullable
			}).optional.nullable.strict(),
			desc: {
				'ja-JP': '位置情報'
			},
			ref: 'geo'
		},

		fileIds: {
			validator: $.arr($.type(ID)).optional.unique().range(1, 4),
			transform: transformMany,
			desc: {
				'ja-JP': '添付するファイル'
			}
		},

		mediaIds: {
			validator: $.arr($.type(ID)).optional.unique().range(1, 4),
			transform: transformMany,
			desc: {
				'ja-JP': '添付するファイル (このパラメータは廃止予定です。代わりに fileIds を使ってください。)'
			}
		},

		replyId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '返信対象'
			}
		},

		renoteId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': 'Renote対象'
			}
		},

		poll: {
			validator: $.obj({
				choices: $.arr($.str)
					.unique()
					.range(2, 10)
					.each(c => c.length > 0 && c.length < 50)
			}).optional.strict(),
			desc: {
				'ja-JP': 'アンケート'
			},
			ref: 'poll'
		}
	},

	res: {
		type: 'object',
		props: {
			createdNote: {
				type: 'entity(Note)',
				desc: {
					'ja-JP': '作成した投稿'
				}
			}
		}
	}
};

const fetchVisibleUsers = async (ids: ObjectID[]) => ids ? await Promise.all(ids.map(_id => User.findOne({ _id }))) : [];

const fetchFiles = async (ids: ObjectID[], userId: ObjectID) => ids ? (await Promise.all(ids.map(_id => DriveFile.findOne({
		_id,
		'metadata.userId': userId
	})))).filter(x => x) : [];

const fetchRenote = async (_id: ObjectID) => _id ? await Note.findOne({ _id })
	.then(x =>
		!x ? error('renoteee is not found') :
		x.renoteId && !x.text && !x.fileIds ? error('cannot renote to renote') :
		x) : null;

const fetchReply = async (_id: ObjectID) => _id ? await Note.findOne({ _id })
	.then(x =>
		x === null ? error('in reply to note is not found') :
		x.renoteId && !x.text && !x.fileIds ? error('cannot reply to renote') :
		x) : null;

const fetchRequirements = async (ps: {
	text: string,
	poll: { choices: string[] },
	visibleUserIds: ObjectID[],
	fileIds: ObjectID[],
	mediaIds: ObjectID[],
	renoteId: ObjectID,
	replyId: ObjectID
}, userId: ObjectID) => {
	const text = ps.text;
	const poll = ps.poll ? ps.poll.choices.map((choice, id) => ({
		id,
		text: choice.trim(),
		votes: 0
	})) : null;
	const visibleUsers = await fetchVisibleUsers(ps.visibleUserIds);
	const files = await fetchFiles(ps.fileIds || ps.mediaIds, userId);
	const renote = await fetchRenote(ps.renoteId);
	const reply = await fetchReply(ps.replyId);
	if (!(text || files.length || renote || poll)) throw 'text, fileIds, renoteId or poll is required';
	return { text, poll, visibleUsers, files, renote, reply };
};

export default define(meta, (ps, user, app) => fetchRequirements(ps, user._id)
	.then(requirements => create(user, {
		...requirements,
		createdAt: new Date(),
		cw: ps.cw,
		app,
		viaMobile: ps.viaMobile,
		localOnly: ps.localOnly,
		visibility: ps.visibility,
		apMentions: ps.noExtractMentions ? [] : undefined,
		apHashtags: ps.noExtractHashtags ? [] : undefined,
		apEmojis: ps.noExtractEmojis ? [] : undefined,
		geo: ps.geo
	}))
	.then(note => pack(note, user))
	.then(createdNote => ({ createdNote })));
