/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_wallet')
export class NoctownWallet {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column({
		...id(),
		comment: 'Player reference',
	})
	public playerId: NoctownPlayer['id'];

	@OneToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('bigint', {
		default: 0,
		comment: 'Noctacoin balance',
	})
	public balance: string; // bigint is stored as string in TypeORM

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Last updated timestamp',
	})
	public updatedAt: Date;
}
