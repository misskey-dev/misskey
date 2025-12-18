/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

// 仕様: FR-034 アイテムトランザクションログシステム
// アイテム・通貨・ペットの全操作を記録し、不正なアイテム増殖を防止する

// トランザクションタイプ定義
export const noctownTransactionTypes = [
	'ITEM_DROP',
	'ITEM_PICKUP',
	'ITEM_PLACE',
	'ITEM_RETRIEVE',
	'TRADE_CREATE',
	'TRADE_ACCEPT',
	'TRADE_DECLINE',
	'TRADE_COMPLETE',
	'TRADE_CANCEL',
	'PET_CREATE',
	'PET_DELETE',
	'CURRENCY_DEPOSIT',
	'CURRENCY_WITHDRAW',
	'CURRENCY_TRADE',
	'FISHING_START',
	'FISHING_COMPLETE',
	'FISHING_CANCEL',
] as const;

export type NoctownTransactionType = typeof noctownTransactionTypes[number];

// 仕様: FR-034 beforeState/afterState の型定義
// 操作前後の状態を記録し、状態遷移の整合性を検証可能にする
export interface NoctownTransactionState {
	location?: 'inventory' | 'ground' | 'map' | 'trade';
	status?: 'active' | 'dropped' | 'picked_up' | 'placed' | 'retrieved' | 'traded' | 'deleted' | 'pending' | 'completed' | 'cancelled';
	ownerId?: string;
	quantity?: number;
	version?: number;
	legacyMode?: boolean;
	// 仕様: 追加のコンテキスト情報用
	positionX?: number;
	positionY?: number;
	positionZ?: number;
	tradeId?: string;
	itemType?: string;
}

@Entity('noctown_transaction_log')
@Index(['playerId', 'createdAt'])
@Index(['targetId', 'type'])
@Index(['isValid'])
export class NoctownTransactionLog {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Player who executed the operation',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('varchar', {
		length: 32,
		comment: 'Transaction type',
	})
	public type: NoctownTransactionType;

	@Column({
		...id(),
		nullable: true,
		comment: 'Target ID (item/pet/trade)',
	})
	public targetId: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'Target player ID (for trades)',
	})
	public targetPlayerId: NoctownPlayer['id'] | null;

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn({ name: 'targetPlayerId' })
	public targetPlayer: NoctownPlayer | null;

	@Column('integer', {
		nullable: true,
		comment: 'Amount/quantity',
	})
	public amount: number | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'State before operation',
	})
	public beforeState: NoctownTransactionState | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'State after operation',
	})
	public afterState: NoctownTransactionState | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Additional metadata (position, etc.)',
	})
	public metadata: Record<string, unknown> | null;

	@Column('boolean', {
		default: true,
		comment: 'Whether operation is valid',
	})
	public isValid: boolean;

	@Column('varchar', {
		length: 256,
		nullable: true,
		comment: 'Reason if operation is invalid',
	})
	public invalidReason: string | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
