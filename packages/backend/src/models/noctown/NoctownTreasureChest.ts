/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownItem } from './NoctownItem.js';

export const treasureChestRarities = [
	'common',
	'uncommon',
	'rare',
	'epic',
	'legendary',
] as const;

export type TreasureChestRarity = typeof treasureChestRarities[number];

@Entity('noctown_treasure_chest')
export class NoctownTreasureChest {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('integer', {
		comment: 'Chunk X coordinate',
	})
	public chunkX: number;

	@Index()
	@Column('integer', {
		comment: 'Chunk Z coordinate',
	})
	public chunkZ: number;

	@Column('real', {
		comment: 'Local X position within chunk',
	})
	public localX: number;

	@Column('real', {
		comment: 'Local Z position within chunk',
	})
	public localZ: number;

	@Column('real', {
		comment: 'Y position (height)',
	})
	public positionY: number;

	@Column('varchar', {
		length: 32,
		default: 'common',
		comment: 'Chest rarity',
	})
	public rarity: TreasureChestRarity;

	@Column('boolean', {
		default: false,
		comment: 'Whether chest has been opened',
	})
	public isOpened: boolean;

	@Column({
		...id(),
		nullable: true,
		comment: 'User who opened this chest',
	})
	public openedByPlayerId: string | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'When the chest was opened',
	})
	public openedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'When the chest will respawn (null = no respawn)',
	})
	public respawnAt: Date | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'Pre-determined item ID',
	})
	public containedItemId: string | null;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public containedItem: NoctownItem | null;

	@Column('integer', {
		default: 1,
		comment: 'Quantity of contained item',
	})
	public containedQuantity: number;

	@Column('integer', {
		default: 0,
		comment: 'Bonus coins in chest',
	})
	public bonusCoins: number;

	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'Interior ID if inside a building',
	})
	public interiorId: string | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
