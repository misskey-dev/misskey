/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_player_statistics')
export class NoctownPlayerStatistics {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column({
		...id(),
		comment: 'Player reference',
	})
	public playerId: NoctownPlayer['id'];

	@OneToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('integer', {
		default: 0,
		comment: 'Total quests completed',
	})
	public questsCompleted: number;

	@Column('bigint', {
		default: 0,
		comment: 'Total quest time in seconds',
	})
	public totalQuestTimeSeconds: string; // bigint is stored as string in TypeORM

	@Column('bigint', {
		default: 0,
		comment: 'Total play time in seconds',
	})
	public totalPlayTimeSeconds: string; // bigint is stored as string in TypeORM

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Last updated timestamp',
	})
	public updatedAt: Date;
}
