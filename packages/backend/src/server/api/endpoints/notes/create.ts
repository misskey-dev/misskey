/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'crypto';
import ms from 'ms';
import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiUser } from '@/models/User.js';
import type { UsersRepository, NotesRepository, BlockingsRepository, DriveFilesRepository, ChannelsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiNote } from '@/models/Note.js';
import type { MiChannel } from '@/models/Channel.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';
import { isQuote, isRenote } from '@/misc/is-renote.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { LoggerService } from '@/core/LoggerService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canCreateContent',

	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	kind: 'write:notes',

	res: {
		type: 'object',
		optional: true, nullable: false,
		properties: {
			createdNote: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'Note',
			},
		},
	},

	errors: {
		processing: {
			message: 'We are processing your request. Please wait a moment.',
			code: 'PROCESSING',
			id: '3247052c-005d-440e-b3d8-2a64274483b0',
			httpStatusCode: 202,
		},

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

		cannotRenoteDueToVisibility: {
			message: 'You can not Renote due to target visibility.',
			code: 'CANNOT_RENOTE_DUE_TO_VISIBILITY',
			id: 'be9529e9-fe72-4de0-ae43-0b363c4938af',
		},

		noSuchReplyTarget: {
			message: 'No such reply target.',
			code: 'NO_SUCH_REPLY_TARGET',
			id: '749ee0f6-d3da-459a-bf02-282e2da4292c',
		},

		cannotReplyToInvisibleNote: {
			message: 'You cannot reply to an invisible Note.',
			code: 'CANNOT_REPLY_TO_AN_INVISIBLE_NOTE',
			id: 'b98980fa-3780-406c-a935-b6d0eeee10d1',
		},

		cannotReplyToPureRenote: {
			message: 'You can not reply to a pure Renote.',
			code: 'CANNOT_REPLY_TO_A_PURE_RENOTE',
			id: '3ac74a84-8fd5-4bb0-870f-01804f82ce15',
		},

		cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility: {
			message: 'You cannot reply to a specified visibility note with extended visibility.',
			code: 'CANNOT_REPLY_TO_SPECIFIED_VISIBILITY_NOTE_WITH_EXTENDED_VISIBILITY',
			id: 'ed940410-535c-4d5e-bfa3-af798671e93c',
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

		noSuchFile: {
			message: 'Some files are not found.',
			code: 'NO_SUCH_FILE',
			id: 'b6992544-63e7-67f0-fa7f-32444b1b5306',
		},

		cannotRenoteOutsideOfChannel: {
			message: 'Cannot renote outside of channel.',
			code: 'CANNOT_RENOTE_OUTSIDE_OF_CHANNEL',
			id: '33510210-8452-094c-6227-4a6c05d99f00',
		},

		containsProhibitedWords: {
			message: 'Cannot post because it contains prohibited words.',
			code: 'CONTAINS_PROHIBITED_WORDS',
			id: 'aa6e01d3-a85c-669d-758a-76aab43af334',
		},

		containsTooManyMentions: {
			message: 'Cannot post because it exceeds the allowed number of mentions.',
			code: 'CONTAINS_TOO_MANY_MENTIONS',
			id: '4de0363a-3046-481b-9b0f-feff3e211025',
		},

		replyingToAnotherBot: {
			message: 'Replying to another bot account is not allowed.',
			code: 'REPLY_TO_BOT_NOT_ALLOWED',
			id: '66819f28-9525-389d-4b0a-4974363fbbbf',
		},

		cannotScheduleToPast: {
			message: 'Cannot schedule to the past.',
			code: 'CANNOT_SCHEDULE_TO_PAST',
			id: 'e577d185-8179-4a17-b47f-6093985558e6',
		},

		cannotScheduleSameTime: {
			message: 'Cannot schedule multiple notes at the same time.',
			code: 'CANNOT_SCHEDULE_SAME_TIME',
			id: '187a8fab-fd83-4ae6-a46c-0f6f07784634',
		},

		tooManyScheduledNotes: {
			message: 'You cannot schedule notes any more.',
			code: 'TOO_MANY_SCHEDULED_NOTES',
			kind: 'permission',
			id: '9e33041f-f6fb-414d-98c1-591466e55287'
		},

		cannotScheduleToFarFuture: {
			message: 'Cannot schedule to the far future.',
			code: 'CANNOT_SCHEDULE_TO_FAR_FUTURE',
			kind: 'permission',
			id: 'ea102856-e8da-4ae9-a98a-0326821bd177',
		},

		rolePermissionDenied: {
			message: 'You are not assigned to a required role.',
			code: 'ROLE_PERMISSION_DENIED',
			kind: 'permission',
			id: '12f1d5d2-f7ec-4d7c-b608-e873f4b20327',
			status: 403,
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
		cw: { type: 'string', nullable: true, minLength: 1, maxLength: 100 },
		localOnly: { type: 'boolean', default: false },
		reactionAcceptance: { type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null },
		noExtractMentions: { type: 'boolean', default: false },
		noExtractHashtags: { type: 'boolean', default: false },
		noExtractEmojis: { type: 'boolean', default: false },
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },

		// anyOf内にバリデーションを書いても最初の一つしかチェックされない
		// See https://github.com/misskey-dev/misskey/pull/10082
		text: {
			type: 'string',
			minLength: 1,
			maxLength: MAX_NOTE_TEXT_LENGTH,
			nullable: true,
		},
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		mediaIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
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
				multiple: { type: 'boolean' },
				expiresAt: { type: 'integer', nullable: true },
				expiredAfter: { type: 'integer', nullable: true, minimum: 1 },
			},
			required: ['choices'],
		},
		scheduledAt: { type: 'integer', nullable: true },
		noCreatedNote: { type: 'boolean', default: false },
	},
	// (re)note with text, files and poll are optional
	if: {
		properties: {
			renoteId: {
				type: 'null',
			},
			fileIds: {
				type: 'null',
			},
			mediaIds: {
				type: 'null',
			},
			poll: {
				type: 'null',
			},
		},
	},
	then: {
		properties: {
			text: {
				type: 'string',
				minLength: 1,
				maxLength: MAX_NOTE_TEXT_LENGTH,
				pattern: '[^\\s]+',
			},
		},
		required: ['text'],
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private loggerService: LoggerService,
		private noteEntityService: NoteEntityService,
		private noteCreateService: NoteCreateService,
		private notificationService: NotificationService,
	) {
		super(meta, paramDef, async (ps, me, _token, _file, _cleanup, ip, headers) => {
			const logger = this.loggerService.getLogger('api:notes:create');
			const hash = createHash('sha256').update(JSON.stringify(ps)).digest('base64');
			logger.setContext({ userId: me.id, hash, ip, headers });
			logger.info('Requested to create a note.');

			const idempotent = process.env.FORCE_IGNORE_IDEMPOTENCY_FOR_TESTING !== 'true' ? await this.redisForTimelines.get(`note:idempotent:${me.id}:${hash}`) : null;
			if (idempotent === '_') { // 他のサーバーで処理中
				logger.warn('The request is being processed by another server.');
				throw new ApiError(meta.errors.processing);
			}

			// すでに同じリクエストが処理されている場合、そのノートを返す
			// ただし、記録されているノート見つからない場合は、新規として処理を続行
			if (idempotent) {
				const note = await this.notesRepository.findOneBy({ id: idempotent });
				if (note) {
					logger.info('The request has already been processed.', { noteId: note.id });
					if (ps.noCreatedNote) return;
					else return { createdNote: await this.noteEntityService.pack(note, me) };
				}
			}

			// 30秒の間、リクエストを処理中として記録
			await this.redisForTimelines.set(`note:idempotent:${me.id}:${hash}`, '_', 'EX', 30);

			let visibleUsers: MiUser[] = [];
			if (ps.visibleUserIds) {
				visibleUsers = await this.usersRepository.findBy({
					id: In(ps.visibleUserIds),
				});
			}

			let files: MiDriveFile[] = [];
			const fileIds = ps.fileIds ?? ps.mediaIds ?? null;
			if (fileIds != null) {
				files = await this.driveFilesRepository.createQueryBuilder('file')
					.where('file.userId = :userId AND file.id IN (:...fileIds)', {
						userId: me.id,
						fileIds,
					})
					.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
					.setParameters({ fileIds })
					.getMany();

				if (files.length !== fileIds.length) {
					logger.error('Some files are not found.', { missingFileIds: fileIds.filter(id => !files.some(file => file.id === id)) });
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			let renote: MiNote | null = null;
			if (ps.renoteId != null) {
				// Fetch renote to note
				renote = await this.notesRepository.findOne({ where: { id: ps.renoteId }, relations: ['user'] });

				if (renote == null) {
					logger.error('No such renote target.', { renoteId: ps.renoteId });
					throw new ApiError(meta.errors.noSuchRenoteTarget);
				} else if (isRenote(renote) && !isQuote(renote)) {
					logger.error('Cannot Renote a pure Renote.', { renoteId: ps.renoteId });
					throw new ApiError(meta.errors.cannotReRenote);
				}

				// Check blocking
				if (renote.userId !== me.id) {
					const blockExist = await this.blockingsRepository.exists({
						where: {
							blockerId: renote.userId,
							blockeeId: me.id,
						},
					});
					if (blockExist) {
						logger.error('User has been blocked by the user who wrote the note.', { renoteUserId: renote.userId });
						throw new ApiError(meta.errors.youHaveBeenBlocked);
					}
				}

				if (renote.visibility === 'followers' && renote.userId !== me.id) {
					// 他人のfollowers noteはreject
					logger.error('Cannot Renote due to target visibility.', { renoteId: ps.renoteId, renoteVisibility: renote.visibility });
					throw new ApiError(meta.errors.cannotRenoteDueToVisibility);
				} else if (renote.visibility === 'specified') {
					// specified / direct noteはreject
					logger.error('Cannot Renote due to target visibility.', { renoteId: ps.renoteId, renoteVisibility: renote.visibility });
					throw new ApiError(meta.errors.cannotRenoteDueToVisibility);
				}

				if (renote.channelId && renote.channelId !== ps.channelId) {
					// チャンネルのノートに対しリノート要求がきたとき、チャンネル外へのリノート可否をチェック
					// リノートのユースケースのうち、チャンネル内→チャンネル外は少数だと考えられるため、JOINはせず必要な時に都度取得する
					const renoteChannel = await this.channelsRepository.findOneBy({ id: renote.channelId });
					if (renoteChannel == null) {
						// リノートしたいノートが書き込まれているチャンネルが無い
						logger.error('No such channel.', { channelId: renote.channelId });
						throw new ApiError(meta.errors.noSuchChannel);
					} else if (!renoteChannel.allowRenoteToExternal) {
						// リノート作成のリクエストだが、対象チャンネルがリノート禁止だった場合
						logger.error('Cannot renote outside of channel.', { channelId: renote.channelId });
						throw new ApiError(meta.errors.cannotRenoteOutsideOfChannel);
					}
				}
			}

			let reply: MiNote | null = null;
			if (ps.replyId != null) {
				// Fetch reply
				reply = await this.notesRepository.findOne({ where: { id: ps.replyId }, relations: ['user'] });

				if (reply == null) {
					logger.error('No such reply target.', { replyId: ps.replyId });
					throw new ApiError(meta.errors.noSuchReplyTarget);
				} else if (isRenote(reply) && !isQuote(reply)) {
					logger.error('Cannot reply to a pure Renote.', { replyId: ps.replyId });
					throw new ApiError(meta.errors.cannotReplyToPureRenote);
				} else if (!await this.noteEntityService.isVisibleForMe(reply, me.id)) {
					logger.error('Cannot reply to an invisible Note.', { replyId: ps.replyId });
					throw new ApiError(meta.errors.cannotReplyToInvisibleNote);
				} else if (reply.visibility === 'specified' && ps.visibility !== 'specified') {
					throw new ApiError(meta.errors.cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility);
				} else if (me.isBot && reply.user!.isBot) {
					throw new ApiError(meta.errors.replyingToAnotherBot);
				}

				// Check blocking
				if (reply.userId !== me.id) {
					const blockExist = await this.blockingsRepository.exists({
						where: {
							blockerId: reply.userId,
							blockeeId: me.id,
						},
					});
					if (blockExist) {
						logger.error('User has been blocked by the user who wrote the note.', { replyUserId: reply.userId });
						throw new ApiError(meta.errors.youHaveBeenBlocked);
					}
				}
			}

			if (ps.poll) {
				if (typeof ps.poll.expiresAt === 'number') {
					if (ps.poll.expiresAt < Date.now()) {
						logger.error('Poll is already expired.', { expiresAt: ps.poll.expiresAt });
						throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
					}
				} else if (typeof ps.poll.expiredAfter === 'number') {
					ps.poll.expiresAt = Date.now() + ps.poll.expiredAfter;
				}
			}

			let channel: MiChannel | null = null;
			if (ps.channelId != null) {
				channel = await this.channelsRepository.findOneBy({ id: ps.channelId, isArchived: false });

				if (channel == null) {
					logger.error('No such channel.', { channelId: ps.channelId });
					throw new ApiError(meta.errors.noSuchChannel);
				}
			}

			let scheduledAt: Date | null = null;
			if (ps.scheduledAt) {
				const now = new Date();
				scheduledAt = new Date(ps.scheduledAt);
				scheduledAt.setMilliseconds(0);

				if (scheduledAt < now) {
					logger.error('Cannot schedule to the past.', { scheduledAt });
					throw new ApiError(meta.errors.cannotScheduleToPast);
				}
			}

			// 投稿を作成
			try {
				const note = await this.noteCreateService.create(me, {
					createdAt: new Date(),
					scheduledAt: ps.scheduledAt ? scheduledAt : null,
					files: files,
					poll: ps.poll ? {
						choices: ps.poll.choices,
						multiple: ps.poll.multiple ?? false,
						expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
					} : undefined,
					text: ps.text ?? undefined,
					reply,
					renote,
					cw: ps.cw,
					localOnly: ps.localOnly,
					reactionAcceptance: ps.reactionAcceptance,
					visibility: ps.visibility,
					visibleUsers,
					channel,
					apMentions: ps.noExtractMentions ? [] : undefined,
					apHashtags: ps.noExtractHashtags ? [] : undefined,
					apEmojis: ps.noExtractEmojis ? [] : undefined,
				});

				// 1分間、リクエストの処理結果を記録
				await this.redisForTimelines.set(`note:idempotent:${me.id}:${hash}`, note.id, 'EX', 60);

				if (!scheduledAt) {
					logger.info('Successfully created a note.', { noteId: note.id });
				} else {
					this.notificationService.createNotification(me.id, "noteScheduled", {
						draftId: note.id,
					});
					logger.info('Successfully scheduled a note.', { draftId: note.id });
				}

				if (ps.noCreatedNote || scheduledAt) return;
				else return {
					createdNote: await this.noteEntityService.pack(note as MiNote, me),
				};
			} catch (err) {
				// エラーが発生した場合、まだ処理中として記録されている場合はリクエストの処理結果を削除
				await this.redisForTimelines.unlinkIf(`note:idempotent:${me.id}:${hash}`, '_');

				logger.error('Failed to create a note.', { error: err });

				if (err instanceof IdentifiableError) {
					if (err.id === '689ee33f-f97c-479a-ac49-1b9f8140af99') throw new ApiError(meta.errors.containsProhibitedWords, { message: err.message });
					if (err.id === '9f466dab-c856-48cd-9e65-ff90ff750580') throw new ApiError(meta.errors.containsTooManyMentions, { message: err.message });
					if (err.id === '5ea8e4f5-9d64-4e6c-92b8-9e2b5a4756bc') throw new ApiError(meta.errors.cannotScheduleSameTime, { message: err.message });
					if (err.id === '7fc78d25-d947-45c1-9547-02257b98cab3') throw new ApiError(meta.errors.tooManyScheduledNotes, { message: err.message });
					if (err.id === '506006cf-3092-4ae1-8145-b025001c591f') throw new ApiError(meta.errors.cannotScheduleToFarFuture, { message: err.message });
					if (err.id === '7cc42034-f7ab-4f7c-87b4-e00854479080') throw new ApiError(meta.errors.rolePermissionDenied, { message: err.message });
				}

				throw err;
			}
		});
	}
}
