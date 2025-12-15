/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-029: チャットメッセージ受信者記録
// 50ブロック以内でメッセージを受信したプレイヤーを記録する中間テーブル
// NoctownChatLog と NoctownPlayer の多対多関係を表現

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownChatLog } from './NoctownChatLog.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_chat_log_recipient')
@Index(['recipientPlayerId', 'receivedAt'])
@Index(['chatLogId'])
export class NoctownChatLogRecipient {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Reference to the chat log',
	})
	public chatLogId: NoctownChatLog['id'];

	@ManyToOne(() => NoctownChatLog, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public chatLog: NoctownChatLog | null;

	@Column({
		...id(),
		comment: 'Recipient player ID',
	})
	public recipientPlayerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public recipientPlayer: NoctownPlayer | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'When the message was received',
	})
	public receivedAt: Date;
}
