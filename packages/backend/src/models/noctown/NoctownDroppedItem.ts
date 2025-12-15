/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownItem } from './NoctownItem.js';
import { NoctownPlayer } from './NoctownPlayer.js';

// 仕様: FR-030 ドロップアイテムの絵文字表現と拾得システム
// ドロップされたアイテムは永続化され、消えることはない
@Entity('noctown_dropped_item')
@Index(['positionX', 'positionZ'])
export class NoctownDroppedItem {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Item reference',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	// 仕様: ドロップしたプレイヤーのID（null = システムドロップ）
	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'Player who dropped this item',
	})
	public droppedByPlayerId: NoctownPlayer['id'] | null;

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public droppedByPlayer: NoctownPlayer | null;

	// 仕様: ドロップされたアイテムの数量
	@Column('integer', {
		default: 1,
		comment: 'Quantity of dropped items',
	})
	public quantity: number;

	@Column('real', {
		comment: 'X coordinate',
	})
	public positionX: number;

	@Column('real', {
		comment: 'Y coordinate',
	})
	public positionY: number;

	@Column('real', {
		comment: 'Z coordinate',
	})
	public positionZ: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Dropped timestamp',
	})
	public droppedAt: Date;
}
