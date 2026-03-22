/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqUserSettingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';

/**
 * noq/settings/update
 * 自分のNoqestion設定を更新する
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			isEnabled: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			requireUsernameDisclosure: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			hideSensitiveQuestions: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			notice: {
				type: 'string',
				optional: false, nullable: true,
			},
			ngWordList: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			e2ePublicKey: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		isEnabled: { type: 'boolean' },
		requireUsernameDisclosure: { type: 'boolean' },
		hideSensitiveQuestions: { type: 'boolean' },
		notice: { type: 'string', nullable: true, maxLength: 1000 },
		ngWordList: {
			type: 'array',
			items: { type: 'string', maxLength: 100 },
			maxItems: 100,
		},
		e2ePublicKey: { type: 'string', nullable: true, maxLength: 64 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqUserSettingsRepository)
		private noqUserSettingsRepository: NoqUserSettingsRepository,

		private noqestionService: NoqestionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 更新パラメータを組み立て
			const updateParams: Record<string, unknown> = {};

			if (ps.isEnabled !== undefined) {
				updateParams.isEnabled = ps.isEnabled;
			}
			if (ps.requireUsernameDisclosure !== undefined) {
				updateParams.requireUsernameDisclosure = ps.requireUsernameDisclosure;
			}
			if (ps.hideSensitiveQuestions !== undefined) {
				updateParams.hideSensitiveQuestions = ps.hideSensitiveQuestions;
			}
			if (ps.notice !== undefined) {
				updateParams.notice = ps.notice;
			}
			if (ps.ngWordList !== undefined) {
				updateParams.ngWordList = ps.ngWordList;
			}
			if (ps.e2ePublicKey !== undefined) {
				updateParams.e2ePublicKey = ps.e2ePublicKey;
			}

			const setting = await this.noqestionService.updateUserSetting(me.id, updateParams);

			return {
				isEnabled: setting.isEnabled,
				requireUsernameDisclosure: setting.requireUsernameDisclosure,
				hideSensitiveQuestions: setting.hideSensitiveQuestions,
				notice: setting.notice,
				ngWordList: setting.ngWordList,
				e2ePublicKey: setting.e2ePublicKey,
			};
		});
	}
}
