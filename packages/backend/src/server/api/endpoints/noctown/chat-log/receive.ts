/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-029: チャットメッセージ受信記録エンドポイント
// 50ブロック以内でメッセージを受信したことを記録する

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type {
	NoctownChatLogsRepository,
	NoctownChatLogRecipientsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
			description: 'The chat log ID to record as received',
		},
	},
	required: ['messageId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownChatLogsRepository)
		private noctownChatLogsRepository: NoctownChatLogsRepository,

		@Inject(DI.noctownChatLogRecipientsRepository)
		private noctownChatLogRecipientsRepository: NoctownChatLogRecipientsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// プレイヤー情報を取得
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				return { success: false };
			}

			// チャットログの存在確認
			const chatLog = await this.noctownChatLogsRepository.findOneBy({ id: ps.messageId });
			if (!chatLog) {
				return { success: false };
			}

			// 自分自身のメッセージは記録しない
			if (chatLog.playerId === player.id) {
				return { success: false };
			}

			// 既に記録済みかチェック
			const existing = await this.noctownChatLogRecipientsRepository.findOneBy({
				chatLogId: ps.messageId,
				recipientPlayerId: player.id,
			});

			if (existing) {
				// 既に記録済み
				return { success: true };
			}

			// 受信記録を作成
			await this.noctownChatLogRecipientsRepository.insert({
				id: this.idService.gen(),
				chatLogId: ps.messageId,
				recipientPlayerId: player.id,
				receivedAt: new Date(),
			});

			return { success: true };
		});
	}
}
