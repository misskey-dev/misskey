/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownItem } from './NoctownItem.js';
import { NoctownInteriorMap } from './NoctownInteriorMap.js';

@Entity('noctown_shop_inventory')
export class NoctownShopInventory {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Interior map ID (shop)',
	})
	public interiorMapId: string;

	@ManyToOne(() => NoctownInteriorMap, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public interiorMap: NoctownInteriorMap | null;

	@Index()
	@Column({
		...id(),
		comment: 'Item ID',
	})
	public itemId: string;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('integer', {
		comment: 'Buy price (player pays this)',
	})
	public buyPrice: number;

	@Column('integer', {
		nullable: true,
		comment: 'Sell price (shop pays this, null = cannot sell)',
	})
	public sellPrice: number | null;

	@Column('integer', {
		nullable: true,
		comment: 'Stock quantity (null = unlimited)',
	})
	public stock: number | null;

	@Column('integer', {
		nullable: true,
		comment: 'Max stock (for restocking)',
	})
	public maxStock: number | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last restock time',
	})
	public lastRestockAt: Date | null;

	@Column('integer', {
		nullable: true,
		comment: 'Restock interval in hours (null = no restock)',
	})
	public restockIntervalHours: number | null;

	@Column('boolean', {
		default: true,
		comment: 'Is available for purchase',
	})
	public isAvailable: boolean;

	@Column('smallint', {
		default: 0,
		comment: 'Display order in shop',
	})
	public displayOrder: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
