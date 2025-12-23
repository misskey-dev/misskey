/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

export const noctownTradeStatuses = [
	'pending', // Waiting for other party to respond
	'accepted', // Other party accepted, waiting for confirmation
	'completed', // Trade completed successfully
	'declined', // Trade was declined by target
	'cancelled', // Trade was cancelled
	'expired', // Trade expired without response
	'failed', // Trade execution failed
] as const;

export type NoctownTradeStatus = typeof noctownTradeStatuses[number];

@Entity('noctown_trade')
@Index(['initiatorId', 'status'])
@Index(['targetId', 'status'])
export class NoctownTrade {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Trade initiator player ID',
	})
	public initiatorId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'initiatorId' })
	public initiator: NoctownPlayer | null;

	@Column({
		...id(),
		comment: 'Trade target player ID',
	})
	public targetId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'targetId' })
	public target: NoctownPlayer | null;

	@Column('varchar', {
		length: 32,
		default: 'pending',
		comment: 'Trade status',
	})
	public status: NoctownTradeStatus;

	@Column('integer', {
		default: 0,
		comment: 'Currency offered by initiator',
	})
	public initiatorCurrency: number;

	@Column('integer', {
		default: 0,
		comment: 'Currency offered by target',
	})
	public targetCurrency: number;

	@Column('boolean', {
		default: false,
		comment: 'Initiator confirmed the trade',
	})
	public initiatorConfirmed: boolean;

	@Column('boolean', {
		default: false,
		comment: 'Target confirmed the trade',
	})
	public targetConfirmed: boolean;

	// T041-T043: トランザクションID管理（不正防止）
	// 仕様: 「交換OK」押下時にトランザクションIDを発行し、トレード実行時に両者のIDを検証
	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'Initiator transaction ID hash (items + currency snapshot)',
	})
	public initiatorTransactionId: string | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'Target transaction ID hash (items + currency snapshot)',
	})
	public targetTransactionId: string | null;

	@Column('text', {
		nullable: true,
		comment: 'Optional message from initiator',
	})
	public message: string | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Completed/cancelled timestamp',
	})
	public completedAt: Date | null;

	@Column('timestamp with time zone', {
		comment: 'Trade expiration time',
	})
	public expiresAt: Date;
}
