import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
const ms = require('ms');
import Note, { INote, isValidText, isValidCw, pack } from '../../../../models/note';
import User, { ILocalUser, IUser } from '../../../../models/user';
import DriveFile, { IDriveFile } from '../../../../models/drive-file';
import create from '../../../../services/note/create';
import { IApp } from '../../../../models/app';
import getParams from '../../get-params';

export const meta = {
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
		visibility: $.str.optional.or(['public', 'home', 'followers', 'specified', 'private']).note({
			default: 'public',
			desc: {
				'ja-JP': '投稿の公開範囲'
			}
		}),

		visibleUserIds: $.arr($.type(ID)).optional.unique().min(1).note({
			desc: {
				'ja-JP': '(投稿の公開範囲が specified の場合)投稿を閲覧できるユーザー'
			}
		}),

		text: $.str.optional.nullable.pipe(isValidText).note({
			default: null,
			desc: {
				'ja-JP': '投稿内容'
			}
		}),

		cw: $.str.optional.nullable.pipe(isValidCw).note({
			desc: {
				'ja-JP': 'コンテンツの警告。このパラメータを指定すると設定したテキストで投稿のコンテンツを隠す事が出来ます。'
			}
		}),

		viaMobile: $.bool.optional.note({
			default: false,
			desc: {
				'ja-JP': 'モバイルデバイスからの投稿か否か。'
			}
		}),

		geo: $.obj({
			coordinates: $.arr().length(2)
				.item(0, $.num.range(-180, 180))
				.item(1, $.num.range(-90, 90)),
			altitude: $.num.nullable,
			accuracy: $.num.nullable,
			altitudeAccuracy: $.num.nullable,
			heading: $.num.nullable.range(0, 360),
			speed: $.num.nullable
		}).optional.nullable.strict().note({
			desc: {
				'ja-JP': '位置情報'
			},
			ref: 'geo'
		}),

		mediaIds: $.arr($.type(ID)).optional.unique().range(1, 4).note({
			desc: {
				'ja-JP': '添付するメディア'
			}
		}),

		renoteId: $.type(ID).optional.note({
			desc: {
				'ja-JP': 'Renote対象'
			}
		}),

		poll: $.obj({
			choices: $.arr($.str)
				.unique()
				.range(2, 10)
				.each(c => c.length > 0 && c.length < 50)
		}).optional.strict().note({
			desc: {
				'ja-JP': 'アンケート'
			},
			ref: 'poll'
		})
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

/**
 * Create a note
 */
export default (params: any, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	let visibleUsers: IUser[] = [];
	if (ps.visibleUserIds !== undefined) {
		visibleUsers = await Promise.all(ps.visibleUserIds.map(id => User.findOne({
			_id: id
		})));
	}

	let files: IDriveFile[] = [];
	if (ps.mediaIds !== undefined) {
		// Fetch files
		// forEach だと途中でエラーなどがあっても return できないので
		// 敢えて for を使っています。
		for (const mediaId of ps.mediaIds) {
			// Fetch file
			// SELECT _id
			const entity = await DriveFile.findOne({
				_id: mediaId,
				'metadata.userId': user._id
			});

			if (entity === null) {
				return rej('file not found');
			} else {
				files.push(entity);
			}
		}
	} else {
		files = null;
	}

	let renote: INote = null;
	if (ps.renoteId !== undefined) {
		// Fetch renote to note
		renote = await Note.findOne({
			_id: ps.renoteId
		});

		if (renote == null) {
			return rej('renoteee is not found');
		} else if (renote.renoteId && !renote.text && !renote.mediaIds) {
			return rej('cannot renote to renote');
		}
	}

	// Get 'replyId' parameter
	const [replyId, replyIdErr] = $.type(ID).optional.get(params.replyId);
	if (replyIdErr) return rej('invalid replyId');

	let reply: INote = null;
	if (replyId !== undefined) {
		// Fetch reply
		reply = await Note.findOne({
			_id: replyId
		});

		if (reply === null) {
			return rej('in reply to note is not found');
		}

		// 返信対象が引用でないRenoteだったらエラー
		if (reply.renoteId && !reply.text && !reply.mediaIds) {
			return rej('cannot reply to renote');
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
	if ((ps.text === undefined || ps.text === null) && files === null && renote === null && ps.poll === undefined) {
		return rej('text, mediaIds, renoteId or poll is required');
	}

	// 投稿を作成
	const note = await create(user, {
		createdAt: new Date(),
		media: files,
		poll: ps.poll,
		text: ps.text,
		reply,
		renote,
		cw: ps.cw,
		app,
		viaMobile: ps.viaMobile,
		visibility: ps.visibility,
		visibleUsers,
		geo: ps.geo
	});

	const noteObj = await pack(note, user);

	// Reponse
	res({
		createdNote: noteObj
	});
});
