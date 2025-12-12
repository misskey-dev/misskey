/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownGacha } from './NoctownGacha.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_gacha_item')
@Index(['gachaId'])
@Index(['itemId'])
export class NoctownGachaItem {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Gacha ID',
	})
	public gachaId: NoctownGacha['id'];

	@ManyToOne(() => NoctownGacha, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public gacha: NoctownGacha | null;

	@Column({
		...id(),
		comment: 'Item ID to be rewarded',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('integer', {
		default: 100,
		comment: 'Weight (higher = more likely)',
	})
	public weight: number;

	@Column('smallint', {
		default: 0,
		comment: 'Rarity tier (0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary)',
	})
	public rarityTier: number;

	@Column('boolean', {
		default: false,
		comment: 'Is unique item (only one in existence)',
	})
	public isUnique: boolean;

	@Column('boolean', {
		default: false,
		comment: 'Has this unique item been pulled already',
	})
	public isUniqueObtained: boolean;

	@Column('integer', {
		nullable: true,
		comment: 'Max quantity available (null = unlimited)',
	})
	public maxQuantity: number | null;

	@Column('integer', {
		default: 0,
		comment: 'Current quantity pulled',
	})
	public currentQuantity: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
