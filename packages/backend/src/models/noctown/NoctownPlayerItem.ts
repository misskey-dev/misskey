/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_player_item')
@Index(['playerId', 'itemId'])
export class NoctownPlayerItem {
	@PrimaryColumn(id())
	public id: string;

	@Index()
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
		comment: 'Item reference',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('integer', {
		default: 1,
		comment: 'Quantity',
	})
	public quantity: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Acquired timestamp',
	})
	public acquiredAt: Date;

	// 仕様: FR-034 楽観的ロック用バージョン
	@Column('integer', {
		default: 1,
		comment: 'Optimistic lock version',
	})
	public version: number;

	// 仕様: コンテナアイテム（宝箱など）の中身
	// 形式: [{ itemId: string, quantity: number }, ...]
	@Column('jsonb', {
		nullable: true,
		comment: 'Contained items for container type (treasure chest, etc.)',
	})
	public containedItems: Array<{ itemId: string; quantity: number }> | null;
}
