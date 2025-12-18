/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { MiUser } from '../User.js';

export const noctownItemTypes = [
	'normal',
	'tool',
	'skin',
	'placeable',
	'agent',
	'seed',
	'feed',
	'house',
	'furniture',
	'wallpaper',
	'frame',
	// 仕様: 採取可能リソースアイテム
	'stone',
	'wood',
	// 仕様: 道具アイテム
	'axe',
	// 仕様: 通貨アイテム
	'currency',
] as const;

export type NoctownItemType = typeof noctownItemTypes[number];

@Entity('noctown_item')
export class NoctownItem {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'Item name',
	})
	public name: string;

	@Column('text', {
		nullable: true,
		comment: 'Flavor text',
	})
	public flavorText: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
		comment: 'Image URL (Drive)',
	})
	public imageUrl: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
		comment: 'Full image URL',
	})
	public fullImageUrl: string | null;

	// 仕様: 画像がない場合に使用するUnicode絵文字（1-2文字）
	// FR-030: ドロップアイテムの絵文字表現
	@Column('varchar', {
		length: 8,
		nullable: true,
		comment: 'Unicode emoji for display when no image (e.g. 🪓)',
	})
	public emoji: string | null;

	@Column('smallint', {
		default: 0,
		comment: 'Rarity (0:N, 1:R, 2:SR, 3:SSR, 4:UR, 5:LR)',
	})
	public rarity: number;

	@Column('varchar', {
		length: 32,
		default: 'normal',
		comment: 'Item type',
	})
	public itemType: NoctownItemType;

	@Column('boolean', {
		default: false,
		comment: 'Unique item flag',
	})
	public isUnique: boolean;

	@Column('boolean', {
		default: false,
		comment: 'Player created flag',
	})
	public isPlayerCreated: boolean;

	@Column({
		...id(),
		nullable: true,
		comment: 'Creator user ID (for player-created items)',
	})
	public creatorId: MiUser['id'] | null;

	@ManyToOne(() => MiUser, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public creator: MiUser | null;

	@Column('integer', {
		nullable: true,
		comment: 'Shop purchase price (null = not for sale)',
	})
	public shopPrice: number | null;

	@Column('integer', {
		nullable: true,
		comment: 'Shop sell price (null = cannot sell)',
	})
	public shopSellPrice: number | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
