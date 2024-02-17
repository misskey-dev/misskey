/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('bubble_game_record')
export class MiBubbleGameRecord {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
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
