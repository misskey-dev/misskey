/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';
import { NoctownNpc } from './NoctownNpc.js';

export const noctownQuestTypes = [
	'collect',
	'deliver',
	'find_name',
	'find_flavor',
] as const;

export type NoctownQuestType = typeof noctownQuestTypes[number];

export const noctownQuestStatuses = [
	'active',
	'completed',
	'abandoned',
] as const;

export type NoctownQuestStatus = typeof noctownQuestStatuses[number];

@Entity('noctown_quest')
@Index(['playerId', 'status'])
export class NoctownQuest {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Quest owner player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('varchar', {
		length: 32,
		comment: 'Quest type',
	})
	public questType: NoctownQuestType;

	@Column('smallint', {
		default: 1,
		comment: 'Difficulty (1-5)',
	})
	public difficulty: number;

	@Column('varchar', {
		length: 16,
		default: 'active',
		comment: 'Quest status',
	})
	public status: NoctownQuestStatus;

	@Column({
		...id(),
		nullable: true,
		comment: 'Target item ID',
	})
	public targetItemId: NoctownItem['id'] | null;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public targetItem: NoctownItem | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Target condition (name/flavor conditions)',
	})
	public targetCondition: Record<string, unknown> | null;

	@Column({
		...id(),
		comment: 'Source NPC ID',
	})
	public sourceNpcId: NoctownNpc['id'];

	@ManyToOne(() => NoctownNpc, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public sourceNpc: NoctownNpc | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'Destination NPC ID (for deliver quests)',
	})
	public destinationNpcId: NoctownNpc['id'] | null;

	@ManyToOne(() => NoctownNpc, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn({ name: 'destinationNpcId' })
	public destinationNpc: NoctownNpc | null;

	@Column('integer', {
		comment: 'Reward coins',
	})
	public rewardCoins: number;

	@Column({
		...id(),
		nullable: true,
		comment: 'Reward item ID',
	})
	public rewardItemId: NoctownItem['id'] | null;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn({ name: 'rewardItemId' })
	public rewardItem: NoctownItem | null;

	@Column('real', {
		nullable: true,
		comment: 'Spawned item X coordinate',
	})
	public spawnedItemX: number | null;

	@Column('real', {
		nullable: true,
		comment: 'Spawned item Z coordinate',
	})
	public spawnedItemZ: number | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Quest started timestamp',
	})
	public startedAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Quest completed timestamp',
	})
	public completedAt: Date | null;
}
