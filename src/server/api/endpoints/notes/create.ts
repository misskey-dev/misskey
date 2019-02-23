import $ from 'cafy';
import ID, { transform, transformMany } from '../../../../misc/cafy-id';
import * as ms from 'ms';
import { length } from 'stringz';
import Note, { INote, isValidCw, pack } from '../../../../models/note';
import User, { IUser } from '../../../../models/user';
import DriveFile, { IDriveFile } from '../../../../models/drive-file';
import create from '../../../../services/note/create';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import { ApiError } from '../../error';

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

	tags: ['notes'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	kind: 'note-write',

	params: {
		visibility: {
			validator: $.optional.str.or(['public', 'home', 'followers', 'specified', 'private']),
			default: 'public',
			desc: {
				'ja-JP': '投稿の公開範囲'
			}
		},

		visibleUserIds: {
			validator: $.optional.arr($.type(ID)).unique().min(0),
			transform: transformMany,
			desc: {
				'ja-JP': '(投稿の公開範囲が specified の場合)投稿を閲覧できるユーザー'
			}
		},

		text: {
			validator: $.optional.nullable.str.pipe(text =>
				length(text.trim()) <= maxNoteTextLength && text.trim() != ''
			),
			default: null as any,
			desc: {
				'ja-JP': '投稿内容'
			}
		},

		cw: {
			validator: $.optional.nullable.str.pipe(isValidCw),
			desc: {
				'ja-JP': 'コンテンツの警告。このパラメータを指定すると設定したテキストで投稿のコンテンツを隠す事が出来ます。'
			}
		},

		viaMobile: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'モバイルデバイスからの投稿か否か。'
			}
		},

		localOnly: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'ローカルのみに投稿か否か。'
			}
		},

		noExtractMentions: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': '本文からメンションを展開しないか否か。'
			}
		},

		noExtractHashtags: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': '本文からハッシュタグを展開しないか否か。'
			}
		},

		noExtractEmojis: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': '本文からカスタム絵文字を展開しないか否か。'
			}
		},

		geo: {
			validator: $.optional.nullable.obj({
				coordinates: $.arr().length(2)
					.item(0, $.num.range(-180, 180))
					.item(1, $.num.range(-90, 90)),
				altitude: $.nullable.num,
				accuracy: $.nullable.num,
				altitudeAccuracy: $.nullable.num,
				heading: $.nullable.num.range(0, 360),
				speed: $.nullable.num
			}).strict(),
			desc: {
				'ja-JP': '位置情報'
			},
			ref: 'geo'
		},

		fileIds: {
			validator: $.optional.arr($.type(ID)).unique().range(1, 4),
			transform: transformMany,
			desc: {
				'ja-JP': '添付するファイル'
			}
		},

		mediaIds: {
			validator: $.optional.arr($.type(ID)).unique().range(1, 4),
			transform: transformMany,
			desc: {
				'ja-JP': '添付するファイル (このパラメータは廃止予定です。代わりに fileIds を使ってください。)'
			}
		},

		replyId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '返信対象'
			}
		},

		renoteId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': 'Renote対象'
			}
		},

		poll: {
			validator: $.optional.obj({
				choices: $.arr($.str)
					.unique()
					.range(2, 10)
					.each(c => c.length > 0 && c.length < 50)
			}).strict(),
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
				type: 'Note',
				desc: {
					'ja-JP': '作成した投稿'
				}
			}
		}
	},

	errors: {
		noSuchRenoteTarget: {
			message: 'No such renote target.',
			code: 'NO_SUCH_RENOTE_TARGET',
			id: 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4'
		},

		cannotReRenote: {
			message: 'You can not Renote a pure Renote.',
			code: 'CANNOT_RENOTE_TO_A_PURE_RENOTE',
			id: 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a'
		},

		noSuchReplyTarget: {
			message: 'No such reply target.',
			code: 'NO_SUCH_REPLY_TARGET',
			id: '749ee0f6-d3da-459a-bf02-282e2da4292c'
		},

		cannotReplyToPureRenote: {
			message: 'You can not reply to a pure Renote.',
			code: 'CANNOT_REPLY_TO_A_PURE_RENOTE',
			id: '3ac74a84-8fd5-4bb0-870f-01804f82ce15'
		},

		contentRequired: {
			message: 'Content required. You need to set text, fileIds, renoteId or poll.',
			code: 'CONTENT_REQUIRED',
			id: '6f57e42b-c348-439b-bc45-993995cc515a'
		},
	}
};

export default define(meta, async (ps, user, app) => {
	let visibleUsers: IUser[] = [];
	if (ps.visibleUserIds) {
		visibleUsers = await Promise.all(ps.visibleUserIds.map(id => User.findOne({
			_id: id
		})));
	}

	let files: IDriveFile[] = [];
	const fileIds = ps.fileIds != null ? ps.fileIds : ps.mediaIds != null ? ps.mediaIds : null;
	if (fileIds != null) {
		files = await Promise.all(fileIds.map(fileId => {
			return DriveFile.findOne({
				_id: fileId,
				'metadata.userId': user._id
			});
		}));

		files = files.filter(file => file != null);
	}

	let renote: INote = null;
	if (ps.renoteId != null) {
		// Fetch renote to note
		renote = await Note.findOne({
			_id: ps.renoteId
		});

		if (renote == null) {
			throw new ApiError(meta.errors.noSuchRenoteTarget);
		} else if (renote.renoteId && !renote.text && !renote.fileIds) {
			throw new ApiError(meta.errors.cannotReRenote);
		}
	}

	let reply: INote = null;
	if (ps.replyId != null) {
		// Fetch reply
		reply = await Note.findOne({
			_id: ps.replyId
		});

		if (reply === null) {
			throw new ApiError(meta.errors.noSuchReplyTarget);
		}

		// 返信対象が引用でないRenoteだったらエラー
		if (reply.renoteId && !reply.text && !reply.fileIds) {
			throw new ApiError(meta.errors.cannotReplyToPureRenote);
		}
	}

	if (ps.poll) {
		(ps.poll as any).choices = (ps.poll as any).choices.map((choice: string, i: number) => ({
			id: i, // IDを付与
			text: choice.trim(),
			votes: 0
		}));
	}

	// テキストが無いかつ添付ファイルが無いかつRenoteも無いかつ投票も無かったらエラー
	if (!(ps.text || files.length || renote || ps.poll)) {
		throw new ApiError(meta.errors.contentRequired);
	}

	// 後方互換性のため
	if (ps.visibility == 'private') {
		ps.visibility = 'specified';
	}

	// 投稿を作成
	const note = await create(user, {
		createdAt: new Date(),
		files: files,
		poll: ps.poll,
		text: ps.text,
		reply,
		renote,
		cw: ps.cw,
		app,
		viaMobile: ps.viaMobile,
		localOnly: ps.localOnly,
		visibility: ps.visibility,
		visibleUsers,
		apMentions: ps.noExtractMentions ? [] : undefined,
		apHashtags: ps.noExtractHashtags ? [] : undefined,
		apEmojis: ps.noExtractEmojis ? [] : undefined,
		geo: ps.geo
	});

	return {
		createdNote: await pack(note, user)
	};
});
