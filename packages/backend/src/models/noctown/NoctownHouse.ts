/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_house')
@Index(['positionX', 'positionZ'])
export class NoctownHouse {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Owner player ID',
	})
	public ownerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public owner: NoctownPlayer | null;

	@Column('varchar', {
		length: 64,
		nullable: true,
		comment: 'House name',
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

	@Column('real', {
		default: 0,
		comment: 'Rotation (degrees)',
	})
	public rotation: number;

	@Column('smallint', {
		default: 1,
		comment: 'House type/style variant',
	})
	public houseType: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
