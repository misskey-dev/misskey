import ms from 'ms';
import { In } from 'typeorm';
import create from '@/services/note/create.js';
import { User } from '@/models/entities/user.js';
import { Users, DriveFiles, Notes, Channels, Blockings } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { Note } from '@/models/entities/note.js';
import { Channel } from '@/models/entities/channel.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { noteVisibilities } from '../../../../types.js';
import { ApiError } from '../../error.js';
import define from '../../define.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	kind: 'write:notes',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			createdNote: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'Note',
			},
		},
	},

	errors: {
		noSuchRenoteTarget: {
			message: 'No such renote target.',
			code: 'NO_SUCH_RENOTE_TARGET',
			id: 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4',
		},

		cannotReRenote: {
			message: 'You can not Renote a pure Renote.',
			code: 'CANNOT_RENOTE_TO_A_PURE_RENOTE',
			id: 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a',
		},

		noSuchReplyTarget: {
			message: 'No such reply target.',
			code: 'NO_SUCH_REPLY_TARGET',
			id: '749ee0f6-d3da-459a-bf02-282e2da4292c',
		},

		cannotReplyToPureRenote: {
			message: 'You can not reply to a pure Renote.',
			code: 'CANNOT_REPLY_TO_A_PURE_RENOTE',
			id: '3ac74a84-8fd5-4bb0-870f-01804f82ce15',
		},

		cannotCreateAlreadyExpiredPoll: {
			message: 'Poll is already expired.',
			code: 'CANNOT_CREATE_ALREADY_EXPIRED_POLL',
			id: '04da457d-b083-4055-9082-955525eda5a5',
		},

		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'b1653923-5453-4edc-b786-7c4f39bb0bbb',
		},

		youHaveBeenBlocked: {
			message: 'You have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'b390d7e1-8a5e-46ed-b625-06271cafd3d3',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'], default: 'public' },
		visibleUserIds: { type: 'array', uniqueItems: true, items: {
			type: 'string', format: 'misskey:id',
		} },
		text: { type: 'string', maxLength: MAX_NOTE_TEXT_LENGTH, nullable: true },
		cw: { type: 'string', nullable: true, maxLength: 100 },
		localOnly: { type: 'boolean', default: false },
		noExtractMentions: { type: 'boolean', default: false },
		noExtractHashtags: { type: 'boolean', default: false },
		noExtractEmojis: { type: 'boolean', default: false },
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		mediaIds: {
			deprecated: true,
			description: 'Use `fileIds` instead. If both are specified, this property is discarded.',
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },
		poll: {
			type: 'object',
			nullable: true,
			properties: {
				choices: {
					type: 'array',
					uniqueItems: true,
					minItems: 2,
					maxItems: 10,
					items: { type: 'string', minLength: 1, maxLength: 50 },
				},
				multiple: { type: 'boolean', default: false },
				expiresAt: { type: 'integer', nullable: true },
				expiredAfter: { type: 'integer', nullable: true, minimum: 1 },
			},
			required: ['choices'],
		},
	},
	anyOf: [
		{
			// (re)note with text, files and poll are optional
			properties: {
				text: { type: 'string', minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH, nullable: false },
			},
			required: ['text'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['fileIds'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['mediaIds'],
		},
		{
			// (re)note with poll, text and files are optional
			properties: {
				poll: { type: 'object', nullable: false },
			},
			required: ['poll'],
		},
		{
			// pure renote
			required: ['renoteId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let visibleUsers: User[] = [];
	if (ps.visibleUserIds) {
		visibleUsers = await Users.findBy({
			id: In(ps.visibleUserIds),
		});
	}

	let files: DriveFile[] = [];
	const fileIds = ps.fileIds != null ? ps.fileIds : ps.mediaIds != null ? ps.mediaIds : null;
	if (fileIds != null) {
		files = await DriveFiles.createQueryBuilder('file')
			.where('file.userId = :userId AND file.id IN (:...fileIds)', {
				userId: user.id,
				fileIds,
			})
			.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
			.setParameters({ fileIds })
			.getMany();
	}

	let renote: Note | null = null;
	if (ps.renoteId != null) {
		// Fetch renote to note
		renote = await Notes.findOneBy({ id: ps.renoteId });

		if (renote == null) {
			throw new ApiError(meta.errors.noSuchRenoteTarget);
		} else if (renote.renoteId && !renote.text && !renote.fileIds && !renote.hasPoll) {
			throw new ApiError(meta.errors.cannotReRenote);
		}

		// Check blocking
		if (renote.userId !== user.id) {
			const block = await Blockings.findOneBy({
				blockerId: renote.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new ApiError(meta.errors.youHaveBeenBlocked);
			}
		}
	}

	let reply: Note | null = null;
	if (ps.replyId != null) {
		// Fetch reply
		reply = await Notes.findOneBy({ id: ps.replyId });

		if (reply == null) {
			throw new ApiError(meta.errors.noSuchReplyTarget);
		} else if (reply.renoteId && !reply.text && !reply.fileIds && !reply.hasPoll) {
			throw new ApiError(meta.errors.cannotReplyToPureRenote);
		}

		// Check blocking
		if (reply.userId !== user.id) {
			const block = await Blockings.findOneBy({
				blockerId: reply.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new ApiError(meta.errors.youHaveBeenBlocked);
			}
		}
	}

	if (ps.poll) {
		if (typeof ps.poll.expiresAt === 'number') {
			if (ps.poll.expiresAt < Date.now()) {
				throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
			}
		} else if (typeof ps.poll.expiredAfter === 'number') {
			ps.poll.expiresAt = Date.now() + ps.poll.expiredAfter;
		}
	}

	let channel: Channel | null = null;
	if (ps.channelId != null) {
		channel = await Channels.findOneBy({ id: ps.channelId });

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
			expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
		} : undefined,
		text: ps.text || undefined,
		reply,
		renote,
		cw: ps.cw,
		localOnly: ps.localOnly,
		visibility: ps.visibility,
		visibleUsers,
		channel,
		apMentions: ps.noExtractMentions ? [] : undefined,
		apHashtags: ps.noExtractHashtags ? [] : undefined,
		apEmojis: ps.noExtractEmojis ? [] : undefined,
	});

	return {
		createdNote: await Notes.pack(note, user),
	};
});
