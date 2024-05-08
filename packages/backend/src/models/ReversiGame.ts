/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('reversi_game')
export class MiReversiGame {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'The started date of the ReversiGame.',
	})
	public startedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'The ended date of the ReversiGame.',
	})
	public endedAt: Date | null;

	@Column(id())
	public user1Id: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user1: MiUser | null;

	@Column(id())
	public user2Id: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user2: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public user1Ready: boolean;

	@Column('boolean', {
		default: false,
	})
	public user2Ready: boolean;

	/**
	 * どちらのプレイヤーが先行(黒)か
	 * 1 ... user1
	 * 2 ... user2
	 */
	@Column('integer', {
		nullable: true,
	})
	public black: number | null;

	@Column('boolean', {
		default: false,
	})
	public isStarted: boolean;

	@Column('boolean', {
		default: false,
	})
	public isEnded: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public winnerId: MiUser['id'] | null;

	@Column({
		...id(),
		nullable: true,
	})
	public surrenderedUserId: MiUser['id'] | null;

	@Column({
		...id(),
		nullable: true,
	})
	public timeoutUserId: MiUser['id'] | null;

	// in sec
	@Column('smallint', {
		default: 90,
	})
	public timeLimitForEachTurn: number;

	@Column('jsonb', {
		default: [],
	})
	public logs: number[][];

	@Column('varchar', {
		array: true, length: 64,
	})
	public map: string[];

	@Column('varchar', {
		length: 32,
	})
	public bw: string;

	@Column('boolean', {
		default: false,
	})
	public noIrregularRules: boolean;

	@Column('boolean', {
		default: false,
	})
	public isLlotheo: boolean;

	@Column('boolean', {
		default: false,
	})
	public canPutEverywhere: boolean;

	@Column('boolean', {
		default: false,
	})
	public loopedBoard: boolean;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public form1: any | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public form2: any | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public crc32: string | null;
}
