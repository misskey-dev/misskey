/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_chicken')
@Index(['positionX', 'positionZ'])
@Index(['spawnX', 'spawnZ'])
export class NoctownChicken {
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

	@Column('varchar', {
		length: 64,
		nullable: true,
		comment: 'Chicken name',
	})
	public name: string | null;

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

	// スポーン位置（NPC移動の中心点）
	@Column('real', {
		comment: 'Spawn X coordinate (NPC movement center)',
	})
	public spawnX: number;

	@Column('real', {
		comment: 'Spawn Z coordinate (NPC movement center)',
	})
	public spawnZ: number;

	// フレーバーテキスト（ペット作成時にマルコフ連鎖で生成）
	@Column('varchar', {
		length: 256,
		comment: 'Markov-chain generated flavor text',
	})
	public flavorText: string;

	@Column('smallint', {
		default: 100,
		comment: 'Hunger level (0-100)',
	})
	public hunger: number;

	@Column('smallint', {
		default: 100,
		comment: 'Happiness level (0-100)',
	})
	public happiness: number;

	@Column('smallint', {
		default: 0,
		comment: 'Eggs ready to collect',
	})
	public eggsReady: number;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last fed timestamp',
	})
	public lastFedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last egg collected timestamp',
	})
	public lastEggCollectedAt: Date | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;

	// 外見情報（色など）をJSONBで保存
	// color: 'white' | 'brown' | 'black' | 'golden' | 'spotted'
	// isRooster: boolean
	// 設定がない場合はwhiteとして扱う
	@Column('jsonb', {
		default: { color: 'white', isRooster: false },
		comment: 'Appearance data (color, isRooster)',
	})
	public appearance: {
		color: 'white' | 'brown' | 'black' | 'golden' | 'spotted';
		isRooster: boolean;
	};
}
