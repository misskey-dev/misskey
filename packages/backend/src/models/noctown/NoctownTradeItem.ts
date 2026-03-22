/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownTrade } from './NoctownTrade.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_trade_item')
@Index(['tradeId'])
export class NoctownTradeItem {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Trade reference',
	})
	public tradeId: NoctownTrade['id'];

	@ManyToOne(() => NoctownTrade, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public trade: NoctownTrade | null;

	@Column({
		...id(),
		comment: 'Item being traded',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('smallint', {
		default: 1,
		comment: 'Quantity being traded',
	})
	public quantity: number;

	@Column('boolean', {
		comment: 'True if offered by initiator, false if offered by target',
	})
	public isFromInitiator: boolean;
}
