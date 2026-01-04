/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqUserSettingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';

/**
 * noq/settings/get
 * 自分のNoqestion設定を取得する
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'read:account',

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
	properties: {},
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
			const setting = await this.noqestionService.getOrCreateUserSetting(me.id);

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
