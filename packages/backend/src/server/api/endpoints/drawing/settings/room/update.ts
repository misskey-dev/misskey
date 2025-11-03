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

	kind: 'write:chat',

	errors: {
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '9c9e5f65-4d2f-5b0e-0a9f-2b3c4d5e6f7g',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		canvasId: { type: 'string' },
		canvasWidth: { type: 'number', minimum: 100, maximum: 4000 },
		canvasHeight: { type: 'number', minimum: 100, maximum: 4000 },
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

			// ルーム設定を更新
			await this.drawingSettingsService.saveRoomSettings(ps.canvasId, {
				canvasWidth: ps.canvasWidth,
				canvasHeight: ps.canvasHeight,
			});
		});
	}
}
