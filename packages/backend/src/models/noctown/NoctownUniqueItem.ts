/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownItem } from './NoctownItem.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_unique_item')
@Index(['itemId'], { unique: true })
@Index(['currentOwnerId'])
@Index(['createdAt'])
export class NoctownUniqueItem {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Base item ID (must be marked as unique)',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('varchar', {
		length: 128,
		comment: 'Unique item serial number or name',
	})
	public serialNumber: string;

	@Column({
		...id(),
		nullable: true,
		comment: 'Current owner player ID',
	})
	public currentOwnerId: NoctownPlayer['id'] | null;

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public currentOwner: NoctownPlayer | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'Original creator player ID (if player-created)',
	})
	public creatorId: NoctownPlayer['id'] | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Ownership history [{playerId, acquiredAt, method}]',
	})
	public ownershipHistory: OwnershipHistoryEntry[] | null;

	@Column('varchar', {
		length: 32,
		default: 'system',
		comment: 'Origin method (system, gacha, quest, craft, trade)',
	})
	public originMethod: string;

	@Column('boolean', {
		default: false,
		comment: 'Is item currently obtainable',
	})
	public isObtainable: boolean;

	@Column('boolean', {
		default: true,
		comment: 'Is item tradeable',
	})
	public isTradeable: boolean;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'When item was first obtained',
	})
	public firstObtainedAt: Date | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Last updated timestamp',
	})
	public updatedAt: Date;
}

export interface OwnershipHistoryEntry {
	playerId: string;
	playerName?: string;
	acquiredAt: string; // ISO date string
	method: 'gacha' | 'quest' | 'craft' | 'trade' | 'admin' | 'event';
	releasedAt?: string; // ISO date string
}
