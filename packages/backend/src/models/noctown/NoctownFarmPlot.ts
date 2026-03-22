/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_farm_plot')
@Index(['positionX', 'positionZ'])
export class NoctownFarmPlot {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Owner player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('real', {
		comment: 'X coordinate',
	})
	public positionX: number;

	@Column('real', {
		comment: 'Y coordinate',
	})
	public positionY: number;

	@Column('real', {
		comment: 'Z coordinate',
	})
	public positionZ: number;

	@Column('smallint', {
		default: 1,
		comment: 'Plot size (1-3)',
	})
	public size: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
