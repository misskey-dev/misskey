/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-029: チャットメッセージ履歴取得エンドポイント
// 中間テーブル(noctown_chat_log_recipient)から自分が受信したメッセージを取得する
// 自分の発言も送信時に中間テーブルに登録されるため、全ての発言を一貫して取得可能

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownChatLogsRepository,
	NoctownChatLogRecipientsRepository,
	NoctownPlayersRepository,
	UsersRepository,
} from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				playerId: { type: 'string' },
				username: { type: 'string' },
				name: { type: 'string', nullable: true },
				avatarUrl: { type: 'string', nullable: true },
				content: { type: 'string' },
				positionX: { type: 'number' },
				positionZ: { type: 'number' },
				createdAt: { type: 'string', format: 'date-time' },
				isMine: { type: 'boolean' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: {
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 50,
		},
	},
	required: [],
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

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			console.log('[chat-history] API called, userId:', me.id);

			// プレイヤー情報を取得
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			console.log('[chat-history] Player found:', player?.id ?? 'null');
			if (!player) {
				console.log('[chat-history] No player found, returning empty array');
				return [];
			}

			const limit = ps.limit ?? 50;

			// FR-029: 中間テーブルから自分が受信したメッセージIDを取得（最新順）
			// 自分の発言も送信時に中間テーブルに登録されるため、全てのメッセージを一貫して取得可能
			const recipients = await this.noctownChatLogRecipientsRepository.find({
				where: { recipientPlayerId: player.id },
				order: { receivedAt: 'DESC' },
				take: limit,
			});
			console.log('[chat-history] Recipients count:', recipients.length);

			if (recipients.length === 0) {
				console.log('[chat-history] No recipients found, returning empty array');
				return [];
			}

			// 受信記録からチャットログIDを取得
			const chatLogIds = recipients.map(r => r.chatLogId);

			// チャットログを取得
			const chatLogs = await this.noctownChatLogsRepository.find({
				where: { id: In(chatLogIds) },
			});

			if (chatLogs.length === 0) {
				return [];
			}

			// receivedAt順に並び替えるためのマップ
			const receivedAtMap = new Map(recipients.map(r => [r.chatLogId, r.receivedAt]));

			// プレイヤーIDのセットを作成
			const playerIds = [...new Set(chatLogs.map(log => log.playerId))];

			// プレイヤー情報を取得
			const players = await this.noctownPlayersRepository.find({
				where: { id: In(playerIds) },
			});
			const playerMap = new Map(players.map(p => [p.id, p]));

			// ユーザーIDのセットを作成
			const userIds = [...new Set(players.map(p => p.userId))];

			// ユーザー情報を取得
			const users = await this.usersRepository.find({
				where: { id: In(userIds) },
			});
			const userMap = new Map(users.map(u => [u.id, u]));

			// レスポンスを構築（receivedAt順でソート）
			const results = chatLogs.map(log => {
				const logPlayer = playerMap.get(log.playerId);
				const user = logPlayer ? userMap.get(logPlayer.userId) : null;
				const isMine = log.playerId === player.id;
				const receivedAt = receivedAtMap.get(log.id) ?? log.createdAt;

				return {
					id: log.id,
					playerId: log.playerId,
					username: user?.username ?? '',
					name: user?.name ?? null,
					avatarUrl: user?.avatarUrl ?? null,
					content: log.content,
					positionX: log.positionX,
					positionZ: log.positionZ,
					createdAt: log.createdAt.toISOString(),
					isMine,
					_receivedAt: receivedAt,
				};
			});

			// receivedAt順にソート（新しい順）
			results.sort((a, b) => b._receivedAt.getTime() - a._receivedAt.getTime());

			// _receivedAtを除外して返す
			return results.map(({ _receivedAt, ...rest }) => rest);
		});
	}
}
