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
			id: 'b1b2c3d4-6e5f-7g8h-9i0j-1k2l3m4n5o6p',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		canvasId: { type: 'string' },
		currentTool: { type: 'string', enum: ['pen', 'eraser', 'eyedropper'], nullable: true },
		currentColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$', nullable: true },
		currentOpacity: { type: 'number', minimum: 0.1, maximum: 1.0, nullable: true },
		strokeWidth: { type: 'number', minimum: 1, maximum: 100, nullable: true },
		currentLayer: { type: 'number', minimum: 0, maximum: 2, nullable: true },
		layerVisible: { type: 'array', items: { type: 'boolean' }, minItems: 3, maxItems: 3, nullable: true },
		layerOpacity: { type: 'array', items: { type: 'number', minimum: 0, maximum: 1 }, minItems: 3, maxItems: 3, nullable: true },
		zoomLevel: { type: 'number', minimum: 0.5, maximum: 10.0, nullable: true },
		panOffsetX: { type: 'number', nullable: true },
		panOffsetY: { type: 'number', nullable: true },
		colors: { type: 'array', items: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, minItems: 16, maxItems: 16, nullable: true },
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

			// ユーザー設定を更新
			await this.drawingSettingsService.saveUserSettings(me.id, ps.canvasId, {
				currentTool: ps.currentTool ?? undefined,
				currentColor: ps.currentColor ?? undefined,
				currentOpacity: ps.currentOpacity ?? undefined,
				strokeWidth: ps.strokeWidth ?? undefined,
				currentLayer: ps.currentLayer ?? undefined,
				layerVisible: ps.layerVisible ?? undefined,
				layerOpacity: ps.layerOpacity ?? undefined,
				zoomLevel: ps.zoomLevel ?? undefined,
				panOffsetX: ps.panOffsetX ?? undefined,
				panOffsetY: ps.panOffsetY ?? undefined,
				colors: ps.colors ?? undefined,
			});
		});
	}
}
