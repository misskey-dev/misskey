import $ from 'cafy';
import * as ms from 'ms';
import { length } from 'stringz';
import create from '../../../../services/note/create';
import define from '../../define';
import { fetchMeta } from '@/misc/fetch-meta';
import { ApiError } from '../../error';
import { ID } from '@/misc/cafy-id';
import { User } from '../../../../models/entities/user';
import { Users, DriveFiles, Notes, Channels } from '../../../../models';
import { DriveFile } from '../../../../models/entities/drive-file';
import { Note } from '../../../../models/entities/note';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/misc/hard-limits';
import { noteVisibilities } from '../../../../types';
import { Channel } from '../../../../models/entities/channel';

let maxNoteTextLength = 500;

setInterval(() => {
	fetchMeta().then(m => {
		maxNoteTextLength = m.maxNoteTextLength;
	});
}, 3000);

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	kind: 'write:notes',

	params: {
		visibility: {
			validator: $.optional.str.or(noteVisibilities as unknown as string[]),
			default: 'public',
		},

		visibleUserIds: {
			validator: $.optional.arr($.type(ID)).unique().min(0),
		},

		text: {
			validator: $.optional.nullable.str.pipe(text =>
				text.trim() != ''
					&& length(text.trim()) <= maxNoteTextLength
					&& Array.from(text.trim()).length <= DB_MAX_NOTE_TEXT_LENGTH	// DB limit
			),
			default: null as any,
		},

		cw: {
			validator: $.optional.nullable.str.pipe(Notes.validateCw),
		},

		viaMobile: {
			validator: $.optional.bool,
			default: false,
		},

		localOnly: {
			validator: $.optional.bool,
			default: false,
		},

		noExtractMentions: {
			validator: $.optional.bool,
			default: false,
		},

		noExtractHashtags: {
			validator: $.optional.bool,
			default: false,
		},

		noExtractEmojis: {
			validator: $.optional.bool,
			default: false,
		},

		fileIds: {
			validator: $.optional.arr($.type(ID)).unique().range(1, 4),
		},

		mediaIds: {
			validator: $.optional.arr($.type(ID)).unique().range(1, 4),
			deprecated: true,
		},

		replyId: {
			validator: $.optional.nullable.type(ID),
		},

		renoteId: {
			validator: $.optional.nullable.type(ID),
		},

		channelId: {
			validator: $.optional.nullable.type(ID),
		},

		poll: {
			validator: $.optional.nullable.obj({
				choices: $.arr($.str)
					.unique()
					.range(2, 10)
					.each(c => c.length > 0 && c.length < 50),
				multiple: $.optional.bool,
				expiresAt: $.optional.nullable.num.int(),
				expiredAfter: $.optional.nullable.num.int().min(1)
			}).strict(),
			ref: 'poll'
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			createdNote: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'Note',
				description: '作成した投稿'
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

		cannotCreateAlreadyExpiredPoll: {
			message: 'Poll is already expired.',
			code: 'CANNOT_CREATE_ALREADY_EXPIRED_POLL',
			id: '04da457d-b083-4055-9082-955525eda5a5'
		},

		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'b1653923-5453-4edc-b786-7c4f39bb0bbb'
		},
	}
};

export default define(meta, async (ps, user) => {
	let visibleUsers: User[] = [];
	if (ps.visibleUserIds) {
		visibleUsers = (await Promise.all(ps.visibleUserIds.map(id => Users.findOne(id))))
			.filter(x => x != null) as User[];
	}

	let files: DriveFile[] = [];
	const fileIds = ps.fileIds != null ? ps.fileIds : ps.mediaIds != null ? ps.mediaIds : null;
	if (fileIds != null) {
		files = (await Promise.all(fileIds.map(fileId =>
			DriveFiles.findOne({
				id: fileId,
				userId: user.id
			})
		))).filter(file => file != null) as DriveFile[];
	}

	let renote: Note | undefined;
	if (ps.renoteId != null) {
		// Fetch renote to note
		renote = await Notes.findOne(ps.renoteId);

		if (renote == null) {
			throw new ApiError(meta.errors.noSuchRenoteTarget);
		} else if (renote.renoteId && !renote.text && !renote.fileIds) {
			throw new ApiError(meta.errors.cannotReRenote);
		}
	}

	let reply: Note | undefined;
	if (ps.replyId != null) {
		// Fetch reply
		reply = await Notes.findOne(ps.replyId);

		if (reply == null) {
			throw new ApiError(meta.errors.noSuchReplyTarget);
		}

		// 返信対象が引用でないRenoteだったらエラー
		if (reply.renoteId && !reply.text && !reply.fileIds) {
			throw new ApiError(meta.errors.cannotReplyToPureRenote);
		}
	}

	if (ps.poll) {
		if (typeof ps.poll.expiresAt === 'number') {
			if (ps.poll.expiresAt < Date.now())
				throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
		} else if (typeof ps.poll.expiredAfter === 'number') {
			ps.poll.expiresAt = Date.now() + ps.poll.expiredAfter;
		}
	}

	// テキストが無いかつ添付ファイルが無いかつRenoteも無いかつ投票も無かったらエラー
	if (!(ps.text || files.length || renote || ps.poll)) {
		throw new ApiError(meta.errors.contentRequired);
	}

	let channel: Channel | undefined;
	if (ps.channelId != null) {
		channel = await Channels.findOne(ps.channelId);

		if (channel == null) {
			throw new ApiError(meta.errors.noSuchChannel);
		}
	}

	// 投稿を作成
	const note = await create(user, {
		createdAt: new Date(),
		files: files,
		poll: ps.poll ? {
			choices: ps.poll.choices,
			multiple: ps.poll.multiple || false,
			expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null
		} : undefined,
		text: ps.text || undefined,
		reply,
		renote,
		cw: ps.cw,
		viaMobile: ps.viaMobile,
		localOnly: ps.localOnly,
		visibility: ps.visibility,
		visibleUsers,
		channel,
		apMentions: ps.noExtractMentions ? [] : undefined,
		apHashtags: ps.noExtractHashtags ? [] : undefined,
		apEmojis: ps.noExtractEmojis ? [] : undefined,
	});

	return {
		createdNote: await Notes.pack(note, user)
	};
});
