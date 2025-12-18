/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_placed_item')
@Index(['positionX', 'positionZ'])
export class NoctownPlacedItem {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Placer player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column({
		...id(),
		comment: 'Item reference',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

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

	@Column('real', {
		default: 0,
		comment: 'Rotation',
	})
	public rotation: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Placed timestamp',
	})
	public placedAt: Date;

	// 仕様: FR-034 楽観的ロック用バージョン（回収時の競合防止）
	@Column('integer', {
		default: 1,
		comment: 'Optimistic lock version',
	})
	public version: number;
}
