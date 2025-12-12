/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownEvent } from './NoctownEvent.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_event_participation')
@Index(['eventId'])
@Index(['playerId'])
@Unique(['eventId', 'playerId'])
export class NoctownEventParticipation {
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

	@Column('integer', {
		default: 0,
		comment: 'Current points earned',
	})
	public points: number;

	@Column('jsonb', {
		default: '[]',
		comment: 'Array of claimed reward IDs',
	})
	public claimedRewards: string[];

	@Column('jsonb', {
		default: '[]',
		comment: 'Array of completed milestone indices',
	})
	public completedMilestones: number[];

	@Column('jsonb', {
		nullable: true,
		comment: 'Event-specific progress data',
	})
	public progressData: Record<string, unknown> | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Joined timestamp',
	})
	public joinedAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last activity timestamp',
	})
	public lastActivityAt: Date | null;
}
