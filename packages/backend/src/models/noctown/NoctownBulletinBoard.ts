/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownWorld } from './NoctownWorld.js';

@Entity('noctown_bulletin_board')
@Index(['worldId', 'positionX', 'positionZ'])
export class NoctownBulletinBoard {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'World ID',
	})
	public worldId: NoctownWorld['id'];

	@ManyToOne(() => NoctownWorld, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public world: NoctownWorld | null;

	@Column('real', {
		comment: 'X position in world',
	})
	public positionX: number;

	@Column('real', {
		comment: 'Z position in world',
	})
	public positionZ: number;

	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'Board name/title',
	})
	public name: string | null;

	@Column('smallint', {
		default: 0,
		comment: 'Board type (0: general, 1: trade, 2: quest)',
	})
	public boardType: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
