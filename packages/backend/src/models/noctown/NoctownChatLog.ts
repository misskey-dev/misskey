/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_chat_log')
@Index(['createdAt'])
@Index(['playerId'])
export class NoctownChatLog {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Author player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('text', {
		comment: 'Chat message content (max 100 chars)',
	})
	public content: string;

	@Column('real', {
		comment: 'X coordinate at time of message',
	})
	public positionX: number;

	@Column('real', {
		comment: 'Z coordinate at time of message',
	})
	public positionZ: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
