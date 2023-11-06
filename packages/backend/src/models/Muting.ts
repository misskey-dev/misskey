/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('muting')
@Index(['muterId', 'muteeId'], { unique: true })
export class MiMuting {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;

	@Index()
	@Column({
		...id(),
		comment: 'The mutee user ID.',
	})
	public muteeId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public mutee: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The muter user ID.',
	})
	public muterId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public muter: MiUser | null;
}
