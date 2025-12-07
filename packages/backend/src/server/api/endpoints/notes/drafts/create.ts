/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteDraftService } from '@/core/NoteDraftService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { ApiError } from '@/server/api/error.js';
import { NoteDraftEntityService } from '@/core/entities/NoteDraftEntityService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			createdDraft: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'NoteDraft',
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

		tooManyDrafts: {
			message: 'You cannot create drafts any more.',
			code: 'TOO_MANY_DRAFTS',
			id: '9ee33bbe-fde3-4c71-9b51-e50492c6b9c8',
		},

		tooManyScheduledNotes: {
			message: 'You cannot create scheduled notes any more.',
			code: 'TOO_MANY_SCHEDULED_NOTES',
			id: '22ae69eb-09e3-4541-a850-773cfa45e693',
		},

		cannotRenoteToExternal: {
			message: 'Cannot Renote to External.',
			code: 'CANNOT_RENOTE_TO_EXTERNAL',
			id: 'ed1952ac-2d26-4957-8b30-2deda76bedf7',
		},

		scheduledAtRequired: {
			message: 'scheduledAt is required when isActuallyScheduled is true.',
			code: 'SCHEDULED_AT_REQUIRED',
			id: '15e28a55-e74c-4d65-89b7-8880cdaaa87d',
		},

		scheduledAtMustBeInFuture: {
			message: 'scheduledAt must be in the future.',
			code: 'SCHEDULED_AT_MUST_BE_IN_FUTURE',
			id: 'e4bed6c9-017e-4934-aed0-01c22cc60ec1',
		},
	},

	limit: {
		duration: ms('1hour'),
		max: 300,
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
		hashtag: { type: 'string', nullable: true, maxLength: 200 },
		localOnly: { type: 'boolean', default: false },
		reactionAcceptance: { type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null },
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },

		// anyOf内にバリデーションを書いても最初の一つしかチェックされない
		text: {
			type: 'string',
			minLength: 0,
			maxLength: MAX_NOTE_TEXT_LENGTH,
			nullable: true,
		},
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 0,
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
					minItems: 0,
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
		isActuallyScheduled: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private noteDraftService: NoteDraftService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const draft = await this.noteDraftService.create(me, {
				fileIds: ps.fileIds ?? [],
				pollChoices: ps.poll?.choices ?? [],
				pollMultiple: ps.poll?.multiple ?? false,
				pollExpiresAt: ps.poll?.expiresAt ? new Date(ps.poll.expiresAt) : null,
				pollExpiredAfter: ps.poll?.expiredAfter ?? null,
				hasPoll: ps.poll != null,
				text: ps.text ?? null,
				replyId: ps.replyId ?? null,
				renoteId: ps.renoteId ?? null,
				cw: ps.cw ?? null,
				hashtag: ps.hashtag ?? null,
				localOnly: ps.localOnly,
				reactionAcceptance: ps.reactionAcceptance,
				visibility: ps.visibility,
				visibleUserIds: ps.visibleUserIds ?? [],
				channelId: ps.channelId ?? null,
				scheduledAt: ps.scheduledAt ? new Date(ps.scheduledAt) : null,
				isActuallyScheduled: ps.isActuallyScheduled,
			}).catch((err) => {
				if (err instanceof IdentifiableError) {
					switch (err.id) {
						case '9ee33bbe-fde3-4c71-9b51-e50492c6b9c8':
							throw new ApiError(meta.errors.tooManyDrafts);
						case '04da457d-b083-4055-9082-955525eda5a5':
							throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
						case 'b6992544-63e7-67f0-fa7f-32444b1b5306':
							throw new ApiError(meta.errors.noSuchFile);
						case '64929870-2540-4d11-af41-3b484d78c956':
							throw new ApiError(meta.errors.noSuchRenoteTarget);
						case '76cc5583-5a14-4ad3-8717-0298507e32db':
							throw new ApiError(meta.errors.cannotReRenote);
						case '075ca298-e6e7-485a-b570-51a128bb5168':
							throw new ApiError(meta.errors.youHaveBeenBlocked);
						case '81eb8188-aea1-4e35-9a8f-3334a3be9855':
							throw new ApiError(meta.errors.cannotRenoteDueToVisibility);
						case '6815399a-6f13-4069-b60d-ed5156249d12':
							throw new ApiError(meta.errors.noSuchChannel);
						case 'ed1952ac-2d26-4957-8b30-2deda76bedf7':
							throw new ApiError(meta.errors.cannotRenoteToExternal);
						case 'c4721841-22fc-4bb7-ad3d-897ef1d375b5':
							throw new ApiError(meta.errors.noSuchReplyTarget);
						case 'e6c10b57-2c09-4da3-bd4d-eda05d51d140':
							throw new ApiError(meta.errors.cannotReplyToPureRenote);
						case '593c323c-6b6a-4501-a25c-2f36bd2a93d6':
							throw new ApiError(meta.errors.cannotReplyToInvisibleNote);
						case '215dbc76-336c-4d2a-9605-95766ba7dab0':
							throw new ApiError(meta.errors.cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility);
						case 'c3275f19-4558-4c59-83e1-4f684b5fab66':
							throw new ApiError(meta.errors.tooManyScheduledNotes);
						case '94a89a43-3591-400a-9c17-dd166e71fdfa':
							throw new ApiError(meta.errors.scheduledAtRequired);
						case 'b34d0c1b-996f-4e34-a428-c636d98df457':
							throw new ApiError(meta.errors.scheduledAtMustBeInFuture);
						default:
							throw err;
					}
				}
				throw err;
			});

			const createdDraft = await this.noteDraftEntityService.pack(draft, me);

			return {
				createdDraft,
			};
		});
	}
}
