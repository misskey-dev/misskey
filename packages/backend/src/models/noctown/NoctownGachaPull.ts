/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownGacha } from './NoctownGacha.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_gacha_pull')
@Index(['gachaId', 'playerId'])
@Index(['playerId'])
export class NoctownGachaPull {
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
		comment: 'Player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column({
		...id(),
		comment: 'Item obtained',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('smallint', {
		comment: 'Rarity tier of the pull',
	})
	public rarityTier: number;

	@Column('boolean', {
		default: false,
		comment: 'Was this a unique item',
	})
	public wasUnique: boolean;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Pull timestamp',
	})
	public pulledAt: Date;
}
