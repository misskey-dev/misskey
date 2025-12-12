/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownEvent } from './NoctownEvent.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_event_reward')
@Index(['eventId'])
@Index(['requiredPoints'])
export class NoctownEventReward {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Event ID',
	})
	public eventId: NoctownEvent['id'];

	@ManyToOne(() => NoctownEvent, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public event: NoctownEvent | null;

	@Column('varchar', {
		length: 128,
		comment: 'Reward name',
	})
	public name: string;

	@Column('text', {
		nullable: true,
		comment: 'Reward description',
	})
	public description: string | null;

	@Column('integer', {
		default: 0,
		comment: 'Points required to claim this reward',
	})
	public requiredPoints: number;

	@Column('varchar', {
		length: 32,
		default: 'item',
		comment: 'Reward type: item, coins, title, badge',
	})
	public rewardType: string;

	@Column({
		...id(),
		nullable: true,
		comment: 'Item ID (if reward type is item)',
	})
	public itemId: NoctownItem['id'] | null;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('integer', {
		default: 1,
		comment: 'Item quantity (if reward type is item)',
	})
	public itemQuantity: number;

	@Column('integer', {
		nullable: true,
		comment: 'Coin amount (if reward type is coins)',
	})
	public coinAmount: number | null;

	@Column('varchar', {
		length: 64,
		nullable: true,
		comment: 'Title or badge ID (if reward type is title/badge)',
	})
	public titleOrBadgeId: string | null;

	@Column('smallint', {
		default: 0,
		comment: 'Display order',
	})
	public displayOrder: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
