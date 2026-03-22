/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownHouse } from './NoctownHouse.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_house_furniture')
@Index(['houseId', 'positionX', 'positionZ'])
export class NoctownHouseFurniture {
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

	@Index()
	@Column({
		...id(),
		comment: 'Furniture item ID',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('real', {
		comment: 'X position in interior',
	})
	public positionX: number;

	@Column('real', {
		comment: 'Z position in interior',
	})
	public positionZ: number;

	@Column('real', {
		default: 0,
		comment: 'Rotation (degrees)',
	})
	public rotation: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Placed timestamp',
	})
	public placedAt: Date;
}
