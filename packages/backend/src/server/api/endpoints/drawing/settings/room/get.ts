/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DrawingSettingsService } from '@/core/DrawingSettingsService.js';
import { DrawingCanvasService } from '@/core/DrawingCanvasService.js';
import { ApiError } from '../../../../error.js';

export const meta = {
	tags: ['drawing', 'chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: {
		type: 'object',
		properties: {
			canvasWidth: { type: 'number' },
			canvasHeight: { type: 'number' },
		},
	},

	errors: {
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '8b8f4d54-3c1e-4a9d-9f8e-1a2b3c4d5e6f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		canvasId: { type: 'string' },
	},
	required: ['canvasId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private drawingSettingsService: DrawingSettingsService,
		private drawingCanvasService: DrawingCanvasService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// アクセス権限確認
			const canAccess = await this.drawingCanvasService.canUserAccessCanvas(ps.canvasId, me.id);
			if (!canAccess) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// ルーム設定を取得
			const settings = await this.drawingSettingsService.getRoomSettings(ps.canvasId);

			return settings;
		});
	}
}
