/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, NoqReportedQuestionsRepository, AbuseUserReportsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '../../../error.js';

/**
 * noq/questions/report
 * 質問を通報する
 * - Misskey標準のAbuseUserReportを作成
 * - NoqReportedQuestion中間テーブルに登録
 * - NoqQuestion.isReportedをtrueに更新
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'write:report-abuse',

	errors: {
		noSuchQuestion: {
			message: 'No such question.',
			code: 'NO_SUCH_QUESTION',
			id: 'noq-report-0001',
		},
		cannotReportOwnQuestion: {
			message: 'Cannot report your own question.',
			code: 'CANNOT_REPORT_OWN_QUESTION',
			id: 'noq-report-0002',
		},
		senderDeleted: {
			message: 'Sender has been deleted.',
			code: 'SENDER_DELETED',
			id: 'noq-report-0003',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			reportId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		questionId: { type: 'string', format: 'misskey:id' },
		comment: { type: 'string', maxLength: 2048 },
	},
	required: ['questionId', 'comment'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		@Inject(DI.noqReportedQuestionsRepository)
		private noqReportedQuestionsRepository: NoqReportedQuestionsRepository,

		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 質問の存在確認
			const question = await this.noqQuestionsRepository.findOneBy({ id: ps.questionId });
			if (question == null) {
				throw new ApiError(meta.errors.noSuchQuestion);
			}

			// senderId が null の場合（ユーザー削除済み）はエラー
			if (question.senderId == null) {
				throw new ApiError(meta.errors.senderDeleted);
			}

			// 自分の質問は通報できない
			if (question.senderId === me.id) {
				throw new ApiError(meta.errors.cannotReportOwnQuestion);
			}

			// AbuseUserReportを作成
			const reportId = this.idService.gen();
			await this.abuseUserReportsRepository.insert({
				id: reportId,
				targetUserId: question.senderId,
				targetUserHost: null,
				reporterId: me.id,
				reporterHost: null,
				comment: `[Noqestion通報] 質問ID: ${question.id}\n\n${ps.comment}`,
			});

			// NoqReportedQuestionを作成
			await this.noqReportedQuestionsRepository.insert({
				id: this.idService.gen(),
				questionId: question.id,
				reportId,
			});

			// NoqQuestion.isReportedをtrueに更新
			await this.noqQuestionsRepository.update(
				{ id: question.id },
				{ isReported: true },
			);

			return {
				success: true,
				reportId,
			};
		});
	}
}
