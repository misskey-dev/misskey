/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_player_score')
@Index(['totalScore'], { where: '"totalScore" > 0' })
export class NoctownPlayerScore {
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
		comment: 'Balance score',
	})
	public balanceScore: number;

	@Column('integer', {
		default: 0,
		comment: 'Item score (rarity weighted)',
	})
	public itemScore: number;

	@Column('integer', {
		default: 0,
		comment: 'Quest score',
	})
	public questScore: number;

	@Column('integer', {
		default: 0,
		comment: 'Speed score (achievement time)',
	})
	public speedScore: number;

	@Column('integer', {
		default: 0,
		comment: 'Total score',
	})
	public totalScore: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Score calculated timestamp',
	})
	public calculatedAt: Date;
}
