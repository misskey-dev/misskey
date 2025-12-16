/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('bubble_game_record')
export class MiBubbleGameRecord {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column('timestamp with time zone')
	public seededAt: Date;

	@Column('varchar', {
		length: 1024,
	})
	public seed: string;

	@Column('integer')
	public gameVersion: number;

	@Column('varchar', {
		length: 128,
	})
	public gameMode: string;

	@Index()
	@Column('integer')
	public score: number;

	@Column('jsonb', {
		default: [],
	})
	public logs: number[][];

	@Column('boolean', {
		default: false,
	})
	public isVerified: boolean;
}
