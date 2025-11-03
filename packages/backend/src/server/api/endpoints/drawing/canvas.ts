/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DrawingCanvasService } from '@/core/DrawingCanvasService.js';
import { ChatService } from '@/core/ChatService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['drawing', 'chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				userId: { type: 'string' },
				userName: { type: 'string' },
				points: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							x: { type: 'number' },
							y: { type: 'number' },
						},
					},
				},
				tool: { type: 'string', enum: ['pen', 'eraser', 'eyedropper'] },
				color: { type: 'string' },
				strokeWidth: { type: 'number' },
				opacity: { type: 'number' },
				timestamp: { type: 'number' },
			},
		},
	},

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '30ec6058-870b-4eda-8b13-f5b735c9c2e8',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '755f18f7-9ac1-43db-8c64-3ba5b7857be8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
	},
	required: ['roomId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private drawingCanvasService: DrawingCanvasService,
		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// アクセス権限確認（ルームまたはユーザー間チャット）
			const canAccess = await this.drawingCanvasService.canUserAccessCanvas(ps.roomId, me.id);
			if (!canAccess) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// キャンバスデータを取得
			const canvasData = await this.drawingCanvasService.getCanvasData(ps.roomId);

			return canvasData;
		});
	}
}