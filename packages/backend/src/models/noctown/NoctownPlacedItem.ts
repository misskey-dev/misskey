/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_placed_item')
@Index(['positionX', 'positionZ'])
export class NoctownPlacedItem {
	@PrimaryColumn(id())
	public id: string;

	// 仕様: 設置者がnullの場合は「不明」として表示
	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'Placer player ID (null = unknown placer)',
	})
	public playerId: NoctownPlayer['id'] | null;

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

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

	@Column('real', {
		default: 0,
		comment: 'Rotation',
	})
	public rotation: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Placed timestamp',
	})
	public placedAt: Date;

	// 仕様: FR-034 楽観的ロック用バージョン（回収時の競合防止）
	@Column('integer', {
		default: 1,
		comment: 'Optimistic lock version',
	})
	public version: number;

	// 仕様: コンテナタイプ（宝箱など）に格納されたアイテム情報
	// 設置時にPlayerItemから引き継がれる
	@Column('jsonb', {
		nullable: true,
		comment: 'Contained items for container type (treasure chest, etc.)',
	})
	public containedItems: Array<{ itemId: string; quantity: number }> | null;
}

