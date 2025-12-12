/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_agent')
@Index(['playerId'])
@Index(['itemId'])
export class NoctownAgent {
	@PrimaryColumn(id())
	public id: string;

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

	@Column({
		...id(),
		comment: 'Agent item ID (defines appearance/type)',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('varchar', {
		length: 64,
		nullable: true,
		comment: 'Custom nickname for the agent',
	})
	public nickname: string | null;

	@Column('smallint', {
		default: 100,
		comment: 'Fullness level (0-100)',
	})
	public fullness: number;

	@Column('smallint', {
		default: 100,
		comment: 'Happiness level (0-100)',
	})
	public happiness: number;

	@Column('integer', {
		default: 1,
		comment: 'Agent level (affects hint quality)',
	})
	public level: number;

	@Column('integer', {
		default: 0,
		comment: 'Experience points',
	})
	public experience: number;

	@Column('boolean', {
		default: false,
		comment: 'Is currently equipped (following player)',
	})
	public isEquipped: boolean;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last fed timestamp',
	})
	public lastFedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last hint given timestamp',
	})
	public lastHintAt: Date | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
