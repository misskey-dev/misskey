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
			currentTool: { type: 'string', enum: ['pen', 'eraser', 'eyedropper'] },
			currentColor: { type: 'string' },
			currentOpacity: { type: 'number' },
			strokeWidth: { type: 'number' },
			currentLayer: { type: 'number' },
			layerVisible: { type: 'array', items: { type: 'boolean' } },
			layerOpacity: { type: 'array', items: { type: 'number' } },
			zoomLevel: { type: 'number' },
			panOffsetX: { type: 'number' },
			panOffsetY: { type: 'number' },
			colors: { type: 'array', items: { type: 'string' }, nullable: true },
		},
	},

	errors: {
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'a0a1b2c3-5d4e-6f7g-8h9i-0j1k2l3m4n5o',
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

			// ユーザー設定を取得
			const settings = await this.drawingSettingsService.getUserSettings(me.id, ps.canvasId);

			return settings;
		});
	}
}
