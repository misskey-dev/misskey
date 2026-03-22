/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownHouse } from './NoctownHouse.js';
import { NoctownPlayerItem } from './NoctownPlayerItem.js';

export const wallItemTypes = ['wallpaper', 'frame'] as const;
export type WallItemType = typeof wallItemTypes[number];

@Entity('noctown_house_wall_item')
@Index(['houseId', 'wallPosition'])
export class NoctownHouseWallItem {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'House ID',
	})
	public houseId: NoctownHouse['id'];

	@ManyToOne(() => NoctownHouse, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public house: NoctownHouse | null;

	@Column('varchar', {
		length: 16,
		comment: 'Wall item type (wallpaper or frame)',
	})
	public type: WallItemType;

	@Column('varchar', {
		length: 16,
		comment: 'Wall position (north, east, south, west)',
	})
	public wallPosition: string;

	@Column('smallint', {
		default: 0,
		comment: 'Position index on the wall (for frames)',
	})
	public positionIndex: number;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'Base item ID (wallpaper or frame item)',
	})
	public baseItemId: string | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'Attached player item ID (for frames, the displayed item)',
	})
	public attachedPlayerItemId: NoctownPlayerItem['id'] | null;

	@ManyToOne(() => NoctownPlayerItem, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public attachedPlayerItem: NoctownPlayerItem | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Updated timestamp',
	})
	public updatedAt: Date | null;
}
