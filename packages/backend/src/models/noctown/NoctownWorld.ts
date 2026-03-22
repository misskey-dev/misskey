/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from '../util/id.js';

// 仕様: ワールドタイプ定義
// default: デフォルトワールド（メイン）
// shrine: 神社ワールド（お正月イベント用）
export const noctownWorldTypes = ['default', 'shrine'] as const;
export type NoctownWorldType = typeof noctownWorldTypes[number];

@Entity('noctown_world')
export class NoctownWorld {
	@PrimaryColumn(id())
	public id: string;

	@Column('bigint', {
		comment: 'Map generation seed',
	})
	public seed: string; // bigint is stored as string in TypeORM

	// 仕様: ワールドタイプ（default, shrine など）
	@Column('varchar', {
		length: 32,
		default: 'default',
		comment: 'World type (default, shrine, etc.)',
	})
	public worldType: NoctownWorldType;

	// 仕様: ワールドの表示名（UI表示用）
	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'World display name',
	})
	public displayName: string | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
